import { defineCommand } from "@interfaces/interactions";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("say")
		.setDescription("Say something with the bot")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("The funny thing you want the bot to say.")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.hasPermission("dev")) return;
		await interaction.complete();

		return interaction.channel.send({
			content: interaction.options.getString("message", true),
		});
	},
});
