import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { media } from "@utility/infoembed";
import { EmbedBuilder } from "@client";
import axios from "axios";
import { colors } from "@utility/colors";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("media")
		.setDescription("Displays all listings for the given resource pack or generally useful links.")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name of the resource pack you want to see the listings of.")
				.addChoices(
					{ name: "Faithful 32x", value: "faithful_32x" },
					{ name: "Faithful 64x", value: "faithful_64x" },
					{ name: "Classic Faithful 32x", value: "classic_faithful_32x" },
					{ name: "Classic Faithful 32x Jappa", value: "classic_faithful_32x_jappa" },
					{ name: "Classic Faithful 64x Jappa", value: "classic_faithful_64x_jappa" },
					// TODO: add cf64pa when listings are added
					{ name: "All", value: "all" },
				),
		),
	async execute(interaction) {
		const key = interaction.options.getString("name", false) ?? "default";

		// you can't import images directly in infoembed.ts so you have to do it here (blame TS)
		const images = (
			await axios.get<Record<string, string>>(`${interaction.client.tokens.apiUrl}settings/images`)
		).data;

		if (key === "all") {
			if (!interaction.hasPermission("manager")) return;
			await interaction.complete();

			return interaction.channel.send({
				embeds: Object.entries(media).map(
					([key, mediaInfo]) =>
						new EmbedBuilder()
							.setTitle(mediaInfo.title)
							.setDescription(mediaInfo.description)
							.setColor(colors[key as keyof typeof colors] ?? colors.brand)
							.setThumbnail(images[key == "default" ? "main" : key]), // "default" is already used
				),
			});
		}

		const embed = new EmbedBuilder()
			.setTitle(media[key].title)
			.setDescription(media[key].description)
			.setColor(colors[key as keyof typeof colors] ?? colors.brand)
			.setThumbnail(images[key == "default" ? "main" : key]);

		return interaction.reply({ embeds: [embed], components: addDeleteButton() });
	},
};
