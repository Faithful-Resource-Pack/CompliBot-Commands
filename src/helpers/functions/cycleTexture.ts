import { Image, createCanvas, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder } from "discord.js";
import GIFEncoder from "@images/GIFEncoder";
import { Client, EmbedBuilder } from "@client";
import { createPathFields } from "@functions/getTexture";
import axios from "axios";
import type { Texture } from "@interfaces/database";
import { parseDisplay } from "./compareTexture";

/**
 * Turn array of canvas images into a gif
 * @author Superboxer47, EwanHowell, Evorp
 * @param images canvas images to stitch together
 * @param framerate framerate of the gif
 * @returns gif as a message attachment
 */
export async function imagesToGIF(images: Image[], framerate = 1) {
	const biggestImage = images.reduce((a, e) => (a.width > e.width ? a : e), {
		width: 0,
		height: 0,
	});

	// magnify all images to an equal size
	const maxWidth = 1024;
	const maxHeight = 1024;
	const maxAspect = maxWidth / maxHeight;
	const aspect = biggestImage.width / biggestImage.height;

	let finalWidth = maxWidth;
	let finalHeight = maxHeight;

	if (maxAspect < aspect) finalHeight = maxWidth / aspect;
	else finalWidth = maxWidth * aspect;

	const encoder = new GIFEncoder(finalWidth, finalHeight);
	encoder.start();
	encoder.setTransparent(true);

	const canvas = createCanvas(finalWidth, finalHeight);
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	for (const image of images) {
		ctx.clearRect(0, 0, finalWidth, finalHeight);
		// convert Image to a Canvas so the encoder can accept it
		ctx.drawImage(image, 0, 0, finalWidth, finalHeight);

		// interface takes ms but our framerate is in seconds
		encoder.setDelay(1000 * framerate);
		encoder.addFrame(ctx);
	}

	encoder.finish();
	return new AttachmentBuilder(encoder.out.getData(), { name: "cycled.gif" });
}

/**
 * Cycles through textures of a specific id
 * @author Evorp, Superboxer47
 * @param client Client used for getting config stuff
 * @param id texture id to look up
 * @param display which texture set to display
 * @param framerate speed
 * @returns reply and edit options
 */
export async function cycleTexture(
	client: Client,
	id: string,
	display: string,
	framerate?: number,
) {
	const result = (await axios.get<Texture>(`${client.tokens.apiUrl}textures/${id}/all`)).data;

	// no 2d arrays in cycle, but same id groups as compare, so we flatten it out
	const packs = parseDisplay(display).flat();

	const embed = new EmbedBuilder()
		.setTitle(`[#${result.id}] ${result.name}`)
		.setURL(`https://studio.faithfulpack.net/gallery?show=${id}`)
		.addFields(createPathFields(result))
		.setFooter({ text: display });

	const images: Image[] = [];
	for (const pack of packs) {
		const url = `${client.tokens.apiUrl}textures/${id}/url/${pack}/latest`;
		try {
			images.push(await loadImage(url));
		} catch {
			/* texture doesn't exist yet */
		}
	}

	const cycled = await imagesToGIF(images, framerate);
	embed.setImage("attachment://cycled.gif");

	// empty array overwrites select menu choices if needed
	return { embeds: [embed], files: [cycled], components: [] };
}
