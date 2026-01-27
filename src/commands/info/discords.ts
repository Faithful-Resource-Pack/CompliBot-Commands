import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { FaithfulGuild } from "@client";
import { toTitleCase } from "@utility/methods";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	async data(client) {
		const guilds = (
			await axios.get<Record<string, FaithfulGuild>>(
				`${client.tokens.apiUrl}settings/discord.guilds`,
			)
		).data;

		return new SlashCommandBuilder()
			.setName("discord")
			.setDescription("Shows a Faithful discord.")
			.addStringOption((option) =>
				option
					.setName("server")
					.setDescription("Which server you want to view.")
					.addChoices(
						{ name: "All", value: "all" },
						...Object.entries(guilds)
							.filter((g) => g[1].invite)
							.map(([k, v]) => ({ name: toTitleCase(k), value: v.invite })),
					)
					.setRequired(true),
			);
	},
	async execute(interaction) {
		const content = interaction.options.getString("server", true);
		if (content === "all") {
			if (!interaction.hasPermission("manager")) return;
			await interaction.complete();

			return interaction.channel.send({
				content: `### Faithful:\nhttps://discord.gg/sN9YRQbBv7\n### Classic Faithful:\nhttps://discord.gg/KSEhCVtg4J\n### Minecraft:\nhttps://discord.gg/minecraft`,
			});
		}
		return interaction.reply({ content, components: addDeleteButton() });
	},
};
