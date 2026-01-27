import {
	ActivityType,
	PermissionFlagsBits,
	PresenceStatusData,
	SlashCommandBuilder,
} from "discord.js";
import { EmbedBuilder } from "@client";
import type { SlashCommand } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("status")
		.setDescription("Changes the bot's status.")
		.addStringOption((option) =>
			option
				.setName("presence")
				.setDescription("What presence the bot should have")
				.addChoices(
					{ name: "Online", value: "online" },
					{ name: "Idle", value: "idle" },
					{ name: "Do not Disturb", value: "dnd" },
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("activity")
				.setDescription("What activity the bot is doing (e.g. playing, streaming)")
				.addChoices(
					...Object.values(ActivityType)
						.filter((x) => typeof x === "string")
						.map((i) => ({ name: i, value: i })),
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("Message to show after the bot activity")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.hasPermission("dev")) return;

		const activity = interaction.options.getString("activity", true);
		const presence = interaction.options.getString("presence", true) as PresenceStatusData;
		const message = interaction.options.getString("message", true);

		interaction.client.user.setPresence({
			activities: [
				{
					name: message,
					type: ActivityType[activity],
				},
			],
			status: presence,
		});

		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle("Bot status successfully changed!")],
			components: addDeleteButton(),
		});
	},
};
