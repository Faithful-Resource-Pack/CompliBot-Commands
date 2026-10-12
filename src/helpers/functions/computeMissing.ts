import type { MinecraftEdition, Pack, PackGitHub } from "@interfaces/database";
import formatPack from "@utility/formatPack";
import { toTitleCase } from "@utility/methods";
import { Client } from "@client";

import { exec, series } from "@helpers/exec";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, normalize } from "path";

import { ChannelType } from "discord.js";
import axios from "axios";

import ignoredTextures from "@json/ignored_textures.json";

// starting from process.cwd()
export const BASE_REPOS_PATH = "repos";

// computing missing also performs validation so we need to return the correct data back
export type MissingData = { edition: MinecraftEdition; version: string };
export type MissingEdition = MinecraftEdition | "all";

interface MissingSuccess {
	stats: {
		missing: number;
		total: number;
		percentage: number;
	};
	files: {
		diff: Buffer;
		nonvanilla?: Buffer;
	};
}

// safe typing so if there's an error the other properties don't get exposed
type MissingBase = { data: MissingData };
export type MissingResult<Success extends boolean> = MissingBase &
	(Success extends true ? MissingSuccess : { error: string });

/**
 * Compute missing results for a given pack and set of editions/versions
 * @author Evorp
 * @param client Discord client
 * @param pack Pack to compute results for
 * @param edition Edition(s) to compute for
 * @param rawVersion Version to compute for (may not actually be valid)
 * @param checkModded Whether to check modded textures
 * @param onProgress Callback to run when a step has finished executing
 * @returns Array of results for each edition
 */
export default async function computeMissing(
	client: Client,
	pack: string,
	edition: MissingEdition,
	rawVersion: string,
	checkModded: boolean,
	onProgress?: (step: string) => Promise<void>,
): Promise<MissingResult<boolean>[]> {
	// if something goes wrong return MissingResult-like data that can be handled by the caller
	function onError(err: unknown, data: MissingData): MissingResult<false> {
		let errMessage = (err as Error)?.message;
		if (!errMessage) {
			console.error(err);
			errMessage = `An error occured when running /missing.\n\nInformation: ${err}`;
		}
		return { data, error: errMessage };
	}

	const versions = (
		await axios.get<Record<MinecraftEdition, string[]>>(`${client.tokens.apiUrl}versions/raw`)
	).data;

	if (edition === "all") {
		const editions = (
			await axios.get<MinecraftEdition[]>(`${client.tokens.apiUrl}settings/editions`)
		).data;

		// since missing editions use independent git repos they can safely run in parallel
		return Promise.all(
			editions.map((edition) => {
				const version = normalizeVersion(versions[edition], rawVersion);
				return computeMissingEdition(client, pack, edition, version, checkModded, onProgress).catch(
					(err: unknown) => onError(err, { edition, version }),
				);
			}),
		);
	}

	const version = normalizeVersion(versions[edition], rawVersion);
	return [
		await computeMissingEdition(client, pack, edition, version, checkModded, onProgress).catch(
			(err: unknown) => onError(err, { edition, version }),
		),
	];
}

/**
 * Compute missing results for a given pack, edition, and version
 * @author Juknum, Evorp
 * @param client Discord client
 * @param pack Pack to compute results for
 * @param edition Edition to compute for
 * @param version Version to compute for
 * @param checkModded Whether to check modded textures
 * @param onProgress Callback to run when a step has finished executing
 * @returns A result object for the given edition
 */
export async function computeMissingEdition(
	client: Client,
	pack: string,
	edition: MinecraftEdition,
	version: string,
	checkModded: boolean,
	onProgress: (step: string) => Promise<void> = async () => {},
): Promise<MissingResult<boolean>> {
	const packs = (await axios.get<Record<string, Pack>>(`${client.tokens.apiUrl}packs/raw`)).data;
	if (!packs[pack].github[edition])
		throw new Error(
			`${formatPack(pack).name} doesn't currently support ${toTitleCase(edition)} Edition.`,
		);

	// same steps are reused for compared repos
	const [defaultPath, requestPath] = await Promise.all([
		syncRepo(packs.default, edition, version, onProgress),
		syncRepo(packs[pack], edition, version, onProgress),
	]);

	await onProgress("Searching for differences…");

	// ignore modded textures if we aren't checking modded
	const editionFilter = ignoredTextures[edition];
	if (checkModded && edition === "java") editionFilter.push(...ignoredTextures.modded);

	// todo: make this async? this can totally be done in parallel
	const defaultTextures = getAllFiles(defaultPath, editionFilter).map((f) =>
		f.replace(defaultPath, ""),
	);
	const requestTextures = getAllFiles(requestPath, editionFilter).map((f) =>
		f.replace(requestPath, ""),
	);

	// https://dev.to/arnaud/using-array-prototype-includes-vs-set-prototype-has-to-filter-arrays-41fg
	const check = new Set(requestTextures);

	// get texture that aren't in the check object
	const diffResult = defaultTextures.filter((path) => !check.has(path));
	const nonvanillaTextures = requestTextures.filter((path) => {
		const normalizedPath = path.replace(/\\/g, "/");
		const validDir =
			normalizedPath.startsWith("/assets/minecraft/textures") ||
			normalizedPath.startsWith("/assets/realms") ||
			normalizedPath.startsWith("/textures");

		return (
			validDir &&
			!defaultTextures.includes(path) &&
			!editionFilter.includes(path) &&
			!normalizedPath.endsWith("huge_chungus.png") // we do a little trolling
		);
	});

	// fix for returning an empty buffer which is still truthy
	const nonvanillaFile = nonvanillaTextures.length
		? Buffer.from(formatResults(nonvanillaTextures), "utf8")
		: undefined;

	const percentage = 100 * (1 - diffResult.length / defaultTextures.length);

	return {
		data: { edition, version },
		stats: {
			missing: diffResult.length,
			total: defaultTextures.length,
			// cap to two decimals then shave off unnecessary zeros
			percentage: Number(percentage.toFixed(2)),
		},
		files: {
			diff: Buffer.from(formatResults(diffResult), "utf8"),
			nonvanilla: nonvanillaFile,
		},
	};
}

/**
 * Updates a progress channel with computed data
 * @author Evorp
 * @param client client to get channel with
 * @param results results to format channel with
 */
export async function updateProgressChannel(
	client: Client,
	packProgress: Record<MinecraftEdition, string>,
	results: MissingResult<true>,
) {
	const channel = client.channels.cache.get(packProgress[results.data.edition]);
	if (!packProgress || !packProgress[results.data.edition] || !channel) return;

	// you can add different patterns depending on the channel type
	switch (channel.type) {
		case ChannelType.GuildVoice: {
			const pattern = /[.\d+]+(?!.*[.\d+])/;
			if (channel.name.match(pattern)?.[0] === results.stats.percentage.toString()) break;
			const updatedName = channel.name.replace(pattern, results.stats.percentage.toString());
			channel.setName(updatedName).catch(console.error);
			break;
		}
	}
}

/**
 * Update or create a GitHub repository
 * @author Evorp, Juknum
 * @returns Cloned path
 */
export async function syncRepo(
	pack: Pack,
	edition: MinecraftEdition,
	version: string,
	onProgress?: (step: string) => Promise<void>,
) {
	const githubInfo: PackGitHub = pack.github[edition];
	const url = `https://github.com/${githubInfo.org}/${githubInfo.repo}.git`;
	const cwd = join(process.cwd(), BASE_REPOS_PATH, githubInfo.repo);

	if (!existsSync(cwd)) {
		await onProgress?.(`Downloading repository \`${githubInfo.org}/${githubInfo.repo}\`…`);
		mkdirSync(cwd, { recursive: true });
		await exec(`git clone ${url} .`, { cwd });
	}

	await onProgress?.(`Updating ${pack.name} to latest \`${version}\` commit…`);
	await series(
		["git stash", "git remote update", "git fetch", `git checkout ${version}`, `git pull`],
		{ cwd },
	);

	return cwd;
}

/**
 * Recursively get all files from a directory with a given filter
 * @author Evorp, Juknum
 * @param dir directory used for recursion
 * @param filter stuff to disallow
 * @returns array of all paths in the directory
 */
export function getAllFiles(dir: string, filter: string[] = []): string[] {
	const fileList: string[] = [];
	readdirSync(dir).forEach((file) => {
		file = normalize(join(dir, file));
		const stat = statSync(file);

		if (file.includes(".git")) return;
		if (stat.isDirectory()) return fileList.push(...getAllFiles(file, filter));
		if (
			ignoredTextures.allowed_extensions.some((ex) => file.endsWith(`.${ex}`)) &&
			!filter.some((i) => file.includes(i))
		)
			fileList.push(file);
	});

	return fileList;
}

/**
 * Format an array of texture paths into a more human-readable format
 * @author Evorp
 * @param results array of results
 * @returns human readable string
 */
export const formatResults = (results: string[]) =>
	results
		.join("\n")
		.replace(/\\/g, "/")
		.replace(/\/assets\/minecraft/g, "")
		// only match at start of line so realms/optifine aren't affected
		.replace(/^\/textures\//gm, "");

/**
 * Make sure that a user-provided version is valid
 * @author Evorp
 * @param available available versions for given edition
 * @param candidate version user provided
 * @returns valid version
 */
export const normalizeVersion = (available: string[], candidate: string) =>
	available.includes(candidate) ? candidate : available[0];
