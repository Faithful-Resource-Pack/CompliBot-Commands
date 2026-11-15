import type { MinecraftEdition, Pack, PackGitHub } from "@interfaces/database";
import type { ProgressCallback } from "@helpers/progressEmbed";
import formatPack from "@utility/formatPack";
import { toTitleCase } from "@utility/methods";
import { Client } from "@client";

import { exec, series } from "@helpers/exec";
import walkSync from "@helpers/walkSync";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

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
		total: number;
		missing: number;
		nonvanilla: number;
	};
	files: {
		missing: Buffer;
		nonvanilla: Buffer;
	};
}

// safe typing so if there's an error the other properties don't get exposed
type MissingBase = { data: MissingData };
export type MissingResult<Success extends boolean> = MissingBase &
	(Success extends true ? MissingSuccess : { error: string });

export interface ExtraChecks {
	modded?: boolean;
	mers?: boolean;
}

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
	checks: ExtraChecks,
	onProgress?: ProgressCallback,
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

	// cache packs so we don't need to fetch twice for multiple editions
	const [packs, versions] = await Promise.all([
		axios.get<Record<string, Pack>>(`${client.tokens.apiUrl}packs/raw`).then((res) => res.data),
		axios
			.get<Record<MinecraftEdition, string[]>>(`${client.tokens.apiUrl}versions/raw`)
			.then((res) => res.data),
	]);

	if (edition === "all") {
		const editions = (
			await axios.get<MinecraftEdition[]>(`${client.tokens.apiUrl}settings/editions`)
		).data;

		// since missing editions use independent git repos they can safely run in parallel
		return Promise.all(
			editions.map((edition) => {
				const version = normalizeVersion(versions[edition], rawVersion);
				return computeMissingEdition(packs, pack, edition, version, checks, onProgress).catch(
					(err: unknown) => onError(err, { edition, version }),
				);
			}),
		);
	}

	const version = normalizeVersion(versions[edition], rawVersion);
	return [
		await computeMissingEdition(packs, pack, edition, version, checks, onProgress).catch(
			(err: unknown) => onError(err, { edition, version }),
		),
	];
}

/**
 * Compute missing results for a given pack, edition, and version
 * @author Juknum, Evorp
 * @param packs Existing packs
 * @param pack Pack to compute results for
 * @param edition Edition to compute for
 * @param version Version to compute for
 * @param checkModded Whether to check modded textures
 * @param onProgress Callback to run when a step has finished executing
 * @returns A result object for the given edition
 */
export async function computeMissingEdition(
	packs: Record<string, Pack>,
	pack: string,
	edition: MinecraftEdition,
	version: string,
	checks: ExtraChecks = { modded: false, mers: false },
	onProgress: ProgressCallback = async () => {},
): Promise<MissingResult<boolean>> {
	if (!packs[pack].github[edition])
		throw new Error(
			`${formatPack(pack).name} doesn't currently support ${toTitleCase(edition)} Edition.`,
		);

	// same steps are reused for compared repos
	const [defaultPath, requestPath] = await Promise.all([
		syncRepo(packs.default.github[edition], version, onProgress),
		syncRepo(packs[pack].github[edition], version, onProgress),
	]);

	await onProgress("Searching for differences…");

	// add modded textures to ignore list if not checking modded
	const editionFilter = ignoredTextures[edition];
	if (!checks.modded) editionFilter.push(...ignoredTextures.modded);
	if (!checks.mers) editionFilter.push(...ignoredTextures.mers);

	const defaultTextures = walkRepo(defaultPath, editionFilter);
	const requestTextures = walkRepo(requestPath, editionFilter);

	// https://dev.to/arnaud/using-array-prototype-includes-vs-set-prototype-has-to-filter-arrays-41fg
	const check = new Set(requestTextures);

	// get texture that aren't in the check object
	const missingResult = defaultTextures.filter((path) => !check.has(path));
	const nonvanillaResult = requestTextures.filter((path) => {
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

	return {
		data: { edition, version },
		stats: {
			total: defaultTextures.length,
			missing: missingResult.length,
			nonvanilla: nonvanillaResult.length,
		},
		files: {
			missing: Buffer.from(formatResults(missingResult), "utf8"),
			nonvanilla: Buffer.from(formatResults(nonvanillaResult), "utf8"),
		},
	};
}

/**
 * Updates a progress channel with computed data
 * @author Evorp
 * @param client client to get channel with
 * @param channelID progress channel to update
 * @param percentage new percentage
 */
export async function updateProgressChannel(client: Client, channelID: string, percentage: number) {
	const channel = client.channels.cache.get(channelID);

	// bot isn't in server or something, it's fine
	if (!channel) return;

	// you can add different patterns depending on the channel type
	switch (channel.type) {
		case ChannelType.GuildVoice: {
			const pattern = /[.\d+]+(?!.*[.\d+])/;
			if (channel.name.match(pattern)?.[0] === percentage.toString()) break;
			const updatedName = channel.name.replace(pattern, percentage.toString());
			channel.setName(updatedName).catch(console.error);
			break;
		}
	}
}

/**
 * Update or create a GitHub repository
 * @author Evorp, Juknum
 * @param packGitHub org and repo data to download
 * @param version branch to check out
 * @param onProgress progress callback
 * @returns Cloned path
 */
export async function syncRepo(
	packGitHub: PackGitHub,
	version: string,
	onProgress?: ProgressCallback,
) {
	const url = `https://github.com/${packGitHub.org}/${packGitHub.repo}.git`;
	const cwd = join(process.cwd(), BASE_REPOS_PATH, packGitHub.repo);

	if (!existsSync(cwd)) {
		await onProgress?.(`Downloading ${packGitHub.repo}…`);
		await mkdir(cwd, { recursive: true });
		await exec(`git clone ${url} .`, { cwd });
	}

	await onProgress?.(`Updating ${packGitHub.repo} to latest commit on branch \`${version}\`…`);
	await series(
		["git stash", "git remote update", "git fetch", `git checkout ${version}`, `git pull`],
		{ cwd },
	);

	return cwd;
}

/**
 * Get all non-git files in a repository with an exclusion list
 * @author Evorp
 * @param dir directory to search
 * @param filter array of patterns to exclude
 * @returns array of relative file paths
 */
export const walkRepo = (dir: string, filter: string[] = []): string[] =>
	walkSync(dir)
		.filter(
			(file) =>
				ignoredTextures.allowed_extensions.some((ex) => file.endsWith(`.${ex}`)) &&
				!filter.some((i) => file.includes(i)),
		)
		// returning relative paths is considerably more useful
		.map((file) => file.replace(dir, ""));

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
 * Format a completion ratio to a percentage
 * @author Evorp
 * @param done How much is done
 * @param total Total results
 * @param round Decimal digits to round to
 * @returns Formatted percentage
 */
export const formatPercentage = (done: number, total: number, round = 2) =>
	Number((100 * (done / total)).toFixed(round));

/**
 * Make sure that a user-provided version is valid
 * @author Evorp
 * @param available available versions for given edition
 * @param candidate version user provided
 * @returns valid version
 */
export const normalizeVersion = (available: string[], candidate: string) =>
	available.includes(candidate) ? candidate : available[0];
