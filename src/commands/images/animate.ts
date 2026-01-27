import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "@client";
import getImage, { imageNotFound } from "@images/getImage";
import { animateToAttachment } from "@helpers/images/animate";
import mcmetaList from "@json/mcmetas.json";
import { magnify } from "@helpers/images/magnify";
import { colors } from "@utility/colors";
import axios from "axios";
import { MCMETA } from "@interfaces/database";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("animate")
		.setDescription("Animate a vertical tilesheet with standard MCMETA rules.")
		.addStringOption((option) =>
			option
				.setName("preset-mcmeta")
				.setDescription("Curated MCMETA presets for the most common rules.")
				.addChoices(
					{ name: "Prismarine", value: "prismarine" },
					{ name: "Fire", value: "fire" },
					{ name: "Flowing Lava", value: "flowing_lava" },
					{ name: "Still Lava", value: "still_lava" },
					{ name: "Magma", value: "magma" },
					{ name: "None", value: "none" },
				)
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName("custom-mcmeta-text")
				.setDescription("Write your own MCMETA rules here (JSON-like format).")
				.setRequired(false),
		)
		.addAttachmentOption((option) =>
			option.setName("custom-mcmeta-file").setDescription("Add your own MCMETA file here."),
		)
		.addAttachmentOption((o) =>
			o.setName("image").setDescription("The tilesheet to animate").setRequired(false),
		),
	async execute(interaction) {
		await interaction.deferReply();

		// fallback if user hasn't provided an mcmeta
		const preset = interaction.options.getString("preset-mcmeta", false) ?? "none";
		let mcmetaText = interaction.options.getString("custom-mcmeta-text", false);
		const mcmetaFile = interaction.options.getAttachment("custom-mcmeta-file", false);

		let mcmeta: MCMETA;
		if (mcmetaText) {
			// add surrounding braces if needed to parse properly
			if (!mcmetaText.endsWith("}")) mcmetaText += "}";
			if (!mcmetaText.startsWith("{")) mcmetaText = "{" + mcmetaText;
			// replace single quotes with double quotes
			mcmetaText = mcmetaText.replace(/'/g, '"');

			const invalidTextEmbed = new EmbedBuilder()
				.setTitle(interaction.strings().command.animate.invalid_text.title)
				.setDescription(interaction.strings().command.animate.invalid_text.description)
				.setColor(colors.red);
			let parsed: any;
			try {
				parsed = JSON.parse(mcmetaText);
			} catch {
				return interaction.ephemeralReply({
					embeds: [invalidTextEmbed],
				});
			}

			mcmeta = parsed.animation ? parsed : { animation: parsed };

			if (mcmeta.animation.frametime <= 0)
				return interaction.ephemeralReply({ embeds: [invalidTextEmbed] });
		} else if (mcmetaFile) {
			mcmeta = (await axios.get<MCMETA>(mcmetaFile.url)).data;

			// invalid mcmeta file given (filters basically everything out)
			if (!mcmeta.animation) {
				return interaction.ephemeralReply({
					embeds: [
						new EmbedBuilder()
							.setTitle(interaction.strings().command.animate.invalid_file.title)
							.setDescription(interaction.strings().command.animate.invalid_file.description)
							.setColor(colors.red),
					],
				});
			}
		} else mcmeta = mcmetaList[preset];

		const image = await getImage(interaction);
		if (!image) return imageNotFound(interaction);

		// magnify beforehand since you can't magnify a gif currently
		const { magnified, width, height } = await magnify(image, { isAnimation: true });
		if (height > width * 32) {
			return interaction.ephemeralReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.image.too_long)
						.setDescription(interaction.strings().error.image.max_length)
						.setColor(colors.red),
				],
			});
		}

		const file = await animateToAttachment(magnified, mcmeta);
		await interaction.editReply({ files: [file], components: addDeleteButton() });
	},
};
