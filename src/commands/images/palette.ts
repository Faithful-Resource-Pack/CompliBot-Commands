import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { paletteToAttachment } from "@images/palette";
import getImage, { imageNotFound } from "@images/getImage";
import { imageTooBig } from "@helpers/warnUser";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("palette")
		.setDescription("Get the colour palette of an image.")
		.setDescriptionLocalization("en-US", "Get the color palette of an image.")
		.addAttachmentOption((o) =>
			o.setName("image").setDescription("The image to palette").setRequired(false),
		),
	async execute(interaction) {
		const image = await getImage(interaction);
		if (!image) return imageNotFound(interaction);

		const [file, embed] = await paletteToAttachment(image);
		if (!file || !embed) return imageTooBig(interaction);

		await interaction.reply({
			embeds: [embed],
			files: [file],
			components: addDeleteButton(),
		});
	},
};
