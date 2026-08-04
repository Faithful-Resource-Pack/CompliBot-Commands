import { defineCommand } from "@interfaces/interactions";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "@client";
import axios from "axios";

export default defineCommand({
	data: new SlashCommandBuilder().setName("info").setDescription("General info about CompliBot."),
	async execute(interaction) {
		const image = (
			await axios.get<string>(`${interaction.client.tokens.apiUrl}settings/images.bot`)
		).data;

		const info = interaction.strings().command.info;
		const embed = new EmbedBuilder()
			.setTitle(info.title)
			.setDescription(info.subtitle)
			.addFields(
				{
					name: info.features.title,
					value: info.features.description,
					inline: true,
				},
				{
					name: info.developing.title,
					value: info.developing.description,
					inline: true,
				},
			)
			.setThumbnail(image);

		interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},
});
