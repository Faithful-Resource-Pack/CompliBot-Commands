import stitch from "@images/stitch";
import { magnify, magnifyToAttachment } from "@images/magnify";
import { Image, loadImage, createCanvas, Canvas } from "@napi-rs/canvas";
import { Client, EmbedBuilder } from "@client";
import { createPathFields } from "@functions/getTexture";
import type { GalleryTexture, MCMETA } from "@interfaces/database";
import axios from "axios";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder } from "discord.js";
import { template } from "@utility/buttons";
import { animateToAttachment } from "@helpers/images/animate";

/**
 * Get the corresponding pack IDs for a given display choice
 * @author Evorp
 * @todo move to pack API using pack tags
 * @param display displayed packs
 * @returns selected packs
 */
export function parseDisplay(display = "all") {
	const PACKS = [
		["default", "faithful_32x", "faithful_64x"],
		["default", "classic_faithful_32x_jappa", "classic_faithful_64x_jappa"],
		["progart", "classic_faithful_32x", "classic_faithful_64x"],
	];
	switch (display) {
		case "Faithful":
			return [PACKS[0]];
		case "Classic Faithful Jappa":
			return [PACKS[1]];
		case "Classic Faithful PA":
			return [PACKS[2]];
		case "Jappa":
			return [PACKS[0], PACKS[1]];
		case "Classic Faithful":
			return [PACKS[1], PACKS[2]];
		default:
			return PACKS;
	}
}

/**
 * Slices tilesheets into individual frames and calculates the number of frames
 * @author Superboxer47
 * @param loadedImages Array of loaded images
 * @param dimension Base image for dimensions
 * @param mcmeta mcmeta for the texture, used for the dimensions of a single frame
 * @returns 3D array of packSet * pack * frames plus the number of frames
 */
export function sliceTileSheet(loadedImages: Image[][], dimension: Image, mcmeta: MCMETA) {
	const frameCount: number = mcmeta.animation?.height
		? dimension.height / mcmeta.animation.height
		: dimension.height / dimension.width; // if height is not specified, assume square image

	const canvasArray: Canvas[][][] = [];
	for (const images of loadedImages) {
		canvasArray.push([]);
		for (const image of images) {
			canvasArray.at(-1).push([]);
			// height of each frame adjusted for resolution
			const individualHeight = image.height / frameCount;
			for (let i = 0; i < frameCount; ++i) {
				// canvas for each frame adjusted for resolution
				const canvas = createCanvas(image.width, individualHeight);
				const ctx = canvas.getContext("2d");
				ctx.imageSmoothingEnabled = false;

				ctx.drawImage(
					image, // image
					0,
					individualHeight * i, // sx, sy
					image.width,
					individualHeight, // sWidth, sHeight
					0,
					0, // dx, dy
					image.width,
					individualHeight, // dWidth, dHeight
				);
				canvasArray.at(-1).at(-1).push(canvas); // putting the new frame into the array
			}
		}
	}
	return { canvasArray, frameCount }; // returns the 3D array with all of the frames and the number of frames
}

/**
 * Generate an array of comparison images for each frame in the animation
 * @author Superboxer47
 * @param canvasArray 3D array of packSet * pack * frames
 * @param frameCount number of frames in the animation
 * @returns 2D array of comparison images * frames
 */
export async function generateComparisonFrames(canvasArray: Canvas[][][], frameCount: number) {
	const stitchedFrames: Image[][] = [];
	for (let i = 0; i < frameCount; ++i) {
		// orient the frames vertically so they stitch properly
		const framePromise: Promise<Image>[] = [];
		// create comparison image for frame i
		framePromise.push(
			stitch(canvasArray.map((imageSet) => imageSet.map((image) => image[i]))).then((buf) =>
				loadImage(buf),
			),
		);

		// optimization to avoid nested awaits (technically still slowish)
		const resolvedFrame = await Promise.all(framePromise);
		stitchedFrames.push(resolvedFrame);
	}

	return stitchedFrames;
}

/**
 * Generate a texture comparison by ID
 * @author Evorp
 * @param client Client used for getting config stuff
 * @param id texture id to look up
 * @param display which texture sets to display
 * @param version which version to use
 * @returns reply and edit options
 */
export default async function compareTexture(
	client: Client,
	id: string,
	display = "all",
	version = "latest",
) {
	const result = (
		await axios.get<GalleryTexture>(`${client.tokens.apiUrl}gallery/modal/${id}/${version}`)
	).data;

	const isAnimated = result.paths.some((p) => p.mcmeta === true);
	const mcmeta = result.mcmeta ?? {};
	const displayMcmeta = structuredClone(mcmeta);

	const packs = parseDisplay(display);

	const dimension = await loadImage(result.urls.default).catch<Image>(() => null);
	if (!dimension || dimension.width * dimension.height * packs.flat().length > 262144) return;

	// load all images at same time using promise.all (faster)
	const loadedImages: Image[][] = await Promise.all(
		packs.map((packSet) =>
			Promise.all<Image | null>(
				packSet.map((pack) => loadImage(result.urls[pack]).catch(() => null)),
			).then((images) => images.filter((image) => image !== null)),
		),
	);

	let attachment: AttachmentBuilder;
	let filename: string;
	if (isAnimated) {
		const { canvasArray, frameCount } = sliceTileSheet(loadedImages, dimension, mcmeta);
		const stitchedFrames = await generateComparisonFrames(canvasArray, frameCount);

		// stitch downwards to create one long tilesheet of full comparison images
		const comparisonImageSheet = await stitch(stitchedFrames, 0);
		const { magnified, factor, height, width } = await magnify(comparisonImageSheet, {
			isAnimation: true,
		});

		mcmeta.animation ||= {};

		// scale mcmeta info for new resolution
		mcmeta.animation.height = mcmeta.animation?.height
			? mcmeta.animation.height * factor
			: height / frameCount;
		mcmeta.animation.width = mcmeta.animation?.width ? mcmeta.animation.width * factor : width;
		filename = `${result.texture.name}.gif`;
		attachment = await animateToAttachment(magnified, mcmeta, filename);
	} else {
		const stitched = await stitch(loadedImages);
		filename = `${result.texture.name}.png`;
		attachment = await magnifyToAttachment(stitched, {}, filename);
	}

	const embed = new EmbedBuilder()
		.setImage(`attachment://${filename}`)
		.setTitle(`[#${result.texture.id}] ${result.texture.name}`)
		.addFields(createPathFields(result))
		.setFooter({ text: `Displaying: ${display ?? "All"}` });

	// put on default page for pack set
	const galleryPack = display.includes("PA") ? "progart" : "default";
	embed.setURL(
		`https://studio.faithfulpack.net/gallery/${result.uses[0].edition}/${galleryPack}/${version}/all/?show=${id}`,
	);

	if (version !== "latest") embed.data.title += ` (${version})`;

	if (Object.keys(displayMcmeta?.animation ?? {}).length)
		embed.addFields({
			name: "MCMETA",
			value: `\`\`\`json\n${JSON.stringify(displayMcmeta.animation)}\`\`\``,
		});

	return {
		embeds: [embed],
		files: [attachment],
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(template)],
	};
}
