import { defineCommand } from "@interfaces/interactions";
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import { EmbedBuilder, Message } from "@client";
import { colors } from "@utility/colors";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("reply")
		.setDescription("Say something with the bot")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("The funny thing you want the bot to say.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName("reply-id").setDescription("Message ID to reply to").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.hasPermission("dev")) return;

		const replyID = interaction.options.getString("reply-id", true);

		let msg: Message | undefined;
		try {
			msg = await interaction.channel?.messages.fetch(replyID);
		} catch {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.message.invalid.title)
						.setDescription(interaction.strings().error.message.invalid.description)
						.setColor(colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});
		} // message can't be fetched

		await interaction.complete();

		msg.reply({ content: interaction.options.getString("message", true) });
	},
});
