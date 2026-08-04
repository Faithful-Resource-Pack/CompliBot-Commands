import { defineCommand } from "@interfaces/interactions";
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("restart")
		.setDescription("Restarts the bot.")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.hasPermission("dev")) return;

		await interaction.reply({ content: "Restarting…", flags: MessageFlags.Ephemeral });
		await interaction.client.restart(interaction);
	},
});
