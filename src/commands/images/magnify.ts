import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { magnifyToAttachment } from "@images/magnify";
import getImage, { imageNotFound } from "@images/getImage";
import { magnifyButtons } from "@utility/buttons";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("magnify")
		.setDescription("Magnify an image.")
		.addAttachmentOption((o) =>
			o.setName("image").setDescription("The image to magnify").setRequired(false),
		)
		.addNumberOption((num) =>
			num
				.addChoices(
					{ name: "0.25x", value: 0.25 },
					{ name: "0.5x", value: 0.5 },
					{ name: "2x", value: 2 },
					{ name: "4x", value: 4 },
					{ name: "8x", value: 8 },
					{ name: "16x", value: 16 },
					{ name: "32x", value: 32 },
				)
				.setName("factor")
				.setDescription("The scale factor the image should be enlarged by.")
				.setRequired(false),
		),
	async execute(interaction) {
		await interaction.deferReply();
		const image = await getImage(interaction);
		if (!image) return imageNotFound(interaction);

		const file = await magnifyToAttachment(image, {
			factor: interaction.options.getNumber("factor", false),
		});

		await interaction.editReply({ files: [file], components: addDeleteButton([magnifyButtons]) });
	},
};
