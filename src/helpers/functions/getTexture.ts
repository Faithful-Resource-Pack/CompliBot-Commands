import { EmbedBuilder } from "@client";
import axios from "axios";
import { APIEmbedField, AttachmentBuilder } from "discord.js";
import { magnify, magnifyToAttachment } from "@images/magnify";
import { colors } from "@utility/colors";
import type {
	Texture,
	Contributor,
	GalleryTexture,
	MinecraftEdition,
	Pack,
} from "@interfaces/database";
import { animateToAttachment } from "@images/animate";
import versionRange from "@utility/versionRange";
import { textureButtons } from "@utility/buttons";
import { Image, loadImage } from "@napi-rs/canvas";
import type { AnyInteraction } from "@interfaces/interactions";

export const MAX_DISPLAYED_AUTHORS = 9; // + 1 for gallery link

/**
 * Create a full texture embed with provided information
 * @author Juknum, Evorp, RobertR11
 * @param interaction interaction to reply to
 * @param texture texture data to use
 * @param pack pack to get authors and formatting from
 * @param version optionally specify specific version to search
 * @returns reply options
 */
export async function getTexture(
	interaction: AnyInteraction,
	texture: Texture,
	pack: string,
	version = "latest",
) {
	const apiUrl = interaction.client.tokens.apiUrl;
	const galleryURL = `https://studio.faithfulpack.net/gallery/${texture.uses[0].edition}/${pack}/${version}/all/?show=${texture.id}`;
	const isAnimated = texture.paths.some((p) => p.mcmeta === true);

	const [textureURL, packData] = await Promise.all([
		// discord hates image redirects in thumbnails
		axios
			.get(`${apiUrl}textures/${texture.id}/url/${pack}/${version}`)
			.then((res): string => res.request.res.responseUrl)
			.catch(() => ""),
		// need to get pack information early if the image doesn't exist
		axios.get<Pack>(`${apiUrl}packs/${pack}`).then((res) => res.data),
	]);

	const files: AttachmentBuilder[] = [];
	const embed = new EmbedBuilder()
		.setTitle(`[#${texture.id}] ${texture.name}`)
		.setURL(galleryURL)
		.setFooter({
			text: packData.name,
			iconURL: packData.logo,
		});

	if (version !== "latest") embed.data.title += ` (${version})`;

	// save image data for magnifying later
	let image: Image;
	try {
		// check if 404
		image = await loadImage(textureURL);
	} catch {
		const errorEmbed = new EmbedBuilder()
			.setTitle(interaction.strings().error.texture.no_image.title)
			.setDescription(
				interaction
					.strings()
					.error.texture.no_image.description.replace("%TEXTURENAME%", texture.name)
					.replace("%VERSION%", version)
					.replace("%PACK%", packData.name),
			)
			.setColor(colors.red);
		// missing texture so we break early
		return { embeds: [errorEmbed], components: [] };
	}

	embed
		.setThumbnail(textureURL)
		.setImage(`attachment://${isAnimated ? "animated.gif" : "magnified.png"}`)
		// we have the loaded image already so can just reuse it for width/height
		.addFields({ name: "Resolution", value: `${image.width}×${image.height}` });

	const lastContribution = texture.contributions
		.filter((contribution) => contribution.pack === pack)
		.sort((a, b) => (a.date > b.date ? -1 : 1))?.[0];

	if (lastContribution) {
		const formattedDate = `<t:${Math.trunc(lastContribution.date / 1000)}:d>`;
		embed.addFields({
			name: `Contributed on ${formattedDate} by`,
			value: await formatTextureAuthors(interaction, lastContribution.authors, galleryURL),
		});

		/** @todo remove this when classic faithful credits are reasonably finished */
		if (
			["classic_faithful_32x_jappa"].includes(pack) &&
			new Date(lastContribution.date).getFullYear() < 2024
		)
			embed.setAuthor({ name: "Note: This contribution may be outdated or misleading." });
	}

	// add path fields at bottom
	embed.addFields(addPathsToEmbed(texture));

	if (isAnimated) {
		const { magnified, factor } = await magnify(image, { isAnimation: true });

		const { mcmeta } = texture;
		// only add mcmeta field if there's special properties there
		if (Object.keys(mcmeta?.animation ?? {}).length) {
			const hasWidth = mcmeta.animation.width !== undefined;
			const hasHeight = mcmeta.animation.height !== undefined;

			// workaround for lack of per-pack mcmeta api support
			if (pack.includes("32x")) {
				if (hasWidth) mcmeta.animation.width *= 2;
				if (hasHeight) mcmeta.animation.height *= 2;
			}

			if (pack.includes("64x")) {
				if (hasWidth) mcmeta.animation.width *= 4;
				if (hasHeight) mcmeta.animation.height *= 4;
			}

			embed.addFields({
				name: "MCMETA",
				value: `\`\`\`json\n${JSON.stringify(mcmeta.animation)}\`\`\``,
			});

			// fix custom sizes (done after adding field since it messes up the numbers)
			if (hasWidth) mcmeta.animation.width *= factor;
			if (hasHeight) mcmeta.animation.height *= factor;
		}

		files.push(await animateToAttachment(magnified, mcmeta));
	} else files.push(await magnifyToAttachment(image));

	return { embeds: [embed], files, components: [textureButtons] };
}

/**
 * Format texture authors into a list
 * @author Evorp
 * @param interaction original interaction
 * @param authors authors to format
 * @param galleryURL for if there's overflow
 * @returns formatted string
 */
export async function formatTextureAuthors(
	interaction: AnyInteraction,
	authors: string[],
	galleryURL: string,
) {
	const displayedAuthors = authors.slice(0, MAX_DISPLAYED_AUTHORS);
	const authorsOutsideServer = displayedAuthors.filter(
		(id) => interaction.guild.members.cache.get(id) === undefined,
	);

	let formattedAuthors: string[];
	if (authorsOutsideServer.length) {
		const rawContributors = (
			await axios.get<Contributor[] | Contributor>(
				`${interaction.client.tokens.apiUrl}users/${authorsOutsideServer.join(",")}`,
			)
		).data;

		const contributors = Array.isArray(rawContributors) ? rawContributors : [rawContributors];

		formattedAuthors = displayedAuthors.map((id) => {
			if (interaction.guild?.members.cache.get(id)) return `<@${id}>`;
			return contributors.find((user) => user.id == id)?.username ?? "Anonymous";
		});
	} else formattedAuthors = displayedAuthors.map((id) => `<@${id}>`);

	const displayedContribution = formattedAuthors.join("\n");
	const missingAuthors = authors.length - displayedAuthors.length;
	if (missingAuthors > 0) {
		const notice = `See ${missingAuthors} more ${missingAuthors === 1 ? "author" : "authors"} on the gallery`;
		return `${displayedContribution}\n[*${notice}*](${galleryURL})`;
	}
	return displayedContribution;
}

/**
 * Generate embed fields for a given texture's paths
 * @author Juknum
 * @param texture texture to get paths and uses from
 * @returns usable embed field data
 */
export function addPathsToEmbed(texture: GalleryTexture | Texture): APIEmbedField[] {
	const groupedPaths = texture.uses.reduce<Partial<Record<MinecraftEdition, string[]>>>(
		(acc, use) => {
			const paths = texture.paths
				.filter((el) => el.use === use.id)
				.map((p) => `\`[${versionRange(p.versions)}]\` ${p.name}`);
			acc[use.edition] ||= [];
			acc[use.edition].push(...paths);
			return acc;
		},
		{},
	);

	// convert from use object to embed-compatible data
	return Object.entries(groupedPaths).map(([edition, paths]) => ({
		name: edition[0].toUpperCase() + edition.slice(1),
		value: paths.join("\n"),
	}));
}
