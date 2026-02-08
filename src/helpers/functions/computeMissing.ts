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

// the stuff that was computed
export interface MissingData {
	edition: MissingEdition;
	pack: string;
	version: string;
	// only created if everything exists
	completion?: number;
	total?: number;
}

// files, context, etc
export interface MissingResult {
	data: MissingData;
	results: string[];
	diffFile?: Buffer;
	nonvanillaFile?: Buffer;
}

export type MissingEdition = MinecraftEdition | "all";

export type PackProgress = Record<string, Record<MinecraftEdition, string>>;

/**
 * Compute missing results for a given pack and set of editions/versions
 * @author Evorp
 * @param client Discord client
 * @param pack Pack to compute results for
 * @param edition Edition(s) to compute for
 * @param version Version to compute for
 * @param checkModded Whether to check modded textures
 * @param onProgress Callback to run when a step has finished executing
 * @returns Array of results for each edition
 */
export default async function computeMissing(
	client: Client,
	pack: string,
	edition: MissingEdition,
	version: string,
	checkModded: boolean,
	onProgress?: (step: string) => Promise<void>,
): Promise<MissingResult[]> {
	const onError = (err: unknown): MissingResult => {
		let errMessage = (err as Error).message;
		if (!errMessage) {
			console.error(err);
			errMessage = `An error occured when running /missing.\n\nInformation: ${err}`;
		}

		return {
			results: [errMessage],
			data: { edition, version, pack },
		};
	};

	// always use latest bedrock version, easier to format
	if (edition === "bedrock") version = "latest";
	if (edition === "all") {
		const editions = (
			await axios.get<MinecraftEdition[]>(`${client.tokens.apiUrl}textures/editions`)
		).data;

		// since missing editions use independent git repos they can safely run in parallel
		return Promise.all(
			editions.map((edition) =>
				computeMissingEdition(client, pack, edition, version, checkModded, onProgress).catch(
					onError,
				),
			),
		);
	}

	return [
		await computeMissingEdition(client, pack, edition, version, checkModded, onProgress).catch(
			onError,
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
): Promise<MissingResult> {
	const packs = (await axios.get<Record<string, Pack>>(`${client.tokens.apiUrl}packs/raw`)).data;
	if (!packs[pack].github[edition])
		throw new Error(`${formatPack(pack).name} doesn't support ${toTitleCase(edition)} Edition.`);

	const versions = (
		await axios.get<string[]>(`${client.tokens.apiUrl}versions/edition/${edition}`)
	).data;

	// need to fetch since client.versions doesn't filter by edition
	if (!versions.includes(version)) version = versions[0];

	// same steps are reused for compared repos
	const [defaultPath, requestPath] = await Promise.all([
		syncRepo(packs.default, edition, version, onProgress),
		syncRepo(packs[pack], edition, version, onProgress),
	]);

	await onProgress("Searching for differences…");

	// ignore modded textures if we aren't checking modded
	const editionFilter = (
		checkModded && edition === "java"
			? ignoredTextures[edition]
			: [...ignoredTextures.modded, ...ignoredTextures[edition]]
	).map(normalize);

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

	const completion = 100 * (1 - diffResult.length / defaultTextures.length);
	return {
		data: {
			pack,
			edition,
			version,
			// cap to two decimals then shave off unnecessary zeros
			completion: Number(completion.toFixed(2)),
			total: defaultTextures.length,
		},
		results: diffResult,
		diffFile: Buffer.from(formatResults(diffResult), "utf8"),
		nonvanillaFile,
	};
}

/**
 * Updates a progress channel with computed data
 * @author Evorp
 * @param client client to get channel with
 * @param results results to format channel with
 */
export async function updateProgressChannel(client: Client, results: MissingData) {
	const allProgress = (
		await axios
			.get<PackProgress>(`${client.tokens.apiUrl}settings/discord.channels.pack_progress`)
			// fix for "Error: socket hang up", I know it's stupid but it works somehow
			.catch(() =>
				axios.get<PackProgress>(
					`https://api.faithfulpack.net/v2/settings/discord.channels.pack_progress`,
				),
			)
	).data;

	const packProgress = allProgress[results.pack];
	if (!packProgress || !packProgress[results.edition]) return;

	const channel = client.channels.cache.get(packProgress[results.edition]);
	// channel doesn't exist or can't be fetched, return early
	if (!channel) return;

	// you can add different patterns depending on the channel type
	switch (channel.type) {
		case ChannelType.GuildVoice: {
			const pattern = /[.\d+]+(?!.*[.\d+])/;
			if (channel.name.match(pattern)?.[0] === results.completion?.toString()) break;
			const updatedName = channel.name.replace(pattern, results.completion.toString());
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
	const url = gitToURL(githubInfo);
	const cwd = join(process.cwd(), BASE_REPOS_PATH, githubInfo.repo);

	if (!existsSync(cwd)) {
		await onProgress?.(`Downloading \`${pack.name}\` (${edition}) pack…`);
		mkdirSync(cwd, { recursive: true });
		await exec(`git clone ${url} .`, { cwd });
	}

	await onProgress?.(`Updating ${pack.name} with latest version of \`${version}\` known…`);
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
			fileList.push(normalize(file));
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
 * Get GitHub git URL from org and repo data
 * @author Evorp
 * @param github git information
 * @returns valid url
 */
export const gitToURL = ({ org, repo }: PackGitHub) => `https://github.com/${org}/${repo}.git`;
