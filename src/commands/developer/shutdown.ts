import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("shutdown")
		.setDescription("Shuts down the bot.")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.hasPermission("dev", false)) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setAuthor({
							name: "Member banned",
							iconURL:
								"https://raw.githubusercontent.com/Faithful-Resource-Pack/Branding/main/role_icons/5%20-%20Moderator.png",
						})
						.setDescription(`<@${interaction.user.id}> has been banned`)
						.addFields({ name: "Reason", value: "trying to stop me lmao" })
						.setColor(colors.red),
				],
				components: addDeleteButton(),
			});
		}
		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Shutting down…")],
		});
		return process.exit();
	},
};
