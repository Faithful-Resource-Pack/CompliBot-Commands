import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { emojis } from "@utility/emojis";

export const compare = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.compare)
	.setCustomId("compare");
export const palette = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.palette)
	.setCustomId("palette");
export const magnify = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.magnify)
	.setCustomId("magnify");
export const tile = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.tile)
	.setCustomId("tile");
export const flip = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.flip)
	.setCustomId("flip");
export const rotate = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.rotate)
	.setCustomId("rotate");

export const template = new ButtonBuilder()
	.setStyle(ButtonStyle.Secondary)
	.setEmoji(emojis.question_mark)
	.setCustomId("comparisonTemplate");

export const reflip = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(emojis.cycle)
	.setCustomId("reflip");

export const deleteMessage = new ButtonBuilder()
	.setStyle(ButtonStyle.Danger)
	.setEmoji(emojis.delete)
	.setCustomId("deleteMessage");
export const deleteInteraction = new ButtonBuilder()
	.setStyle(ButtonStyle.Danger)
	.setEmoji(emojis.delete)
	.setCustomId("deleteInteraction");

export const magnifyButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(tile, palette);

export const imageButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
	magnify,
	tile,
	palette,
);

export const tileButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
	tile,
	rotate,
	flip,
	palette,
);

export const textureButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
	tile,
	palette,
	compare,
);
