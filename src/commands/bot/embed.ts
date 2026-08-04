import { defineCommand } from "@interfaces/interactions";
import { EmbedBuilder } from "@client";
import {
	ColorResolvable,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { colors } from "@utility/colors";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("embed")
		.setDescription(`Create a one-time custom embed.`)
		.addStringOption((option) =>
			option
				.setName("title")
				.setDescription("What title the embed should have.")
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName("description")
				.setDescription("What description the embed should have.")
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName("colour")
				.setNameLocalization("en-US", "color")
				.setDescription("Set the colour on the side of the embed.")
				.setDescriptionLocalization("en-US", "Set the color on the side of the embed.")
				.setRequired(false),
		)
		.addStringOption((option) =>
			option.setName("footer").setDescription("Adds a footer to the embed").setRequired(false),
		)
		.addAttachmentOption((option) =>
			option.setName("image").setDescription("Adds a main image to the embed").setRequired(false),
		)
		.addAttachmentOption((option) =>
			option
				.setName("thumbnail")
				.setDescription("Add a thumbnail to the top right corner of the embed")
				.setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.options.getString("title") && !interaction.options.getString("description")) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().command.embed.not_enough_arguments)
						.setDescription(interaction.strings().command.embed.need_more_info)
						.setColor(colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.complete();

		const embed = new EmbedBuilder();

		// a lot of copy/paste but this is the best djs can do lol
		const title = interaction.options.getString("title", false);
		const description = interaction.options.getString("description", false);
		const color = interaction.options.getString("colour", false);
		const footer = interaction.options.getString("footer", false);
		const image = interaction.options.getAttachment("image", false)?.url;
		const thumbnail = interaction.options.getAttachment("thumbnail", false)?.url;

		if (title) embed.setTitle(title);
		if (description) embed.setDescription(description);
		if (color) {
			const presetColor = colors[color as keyof typeof colors];
			if (presetColor) embed.setColor(presetColor);
			else if (!color.startsWith("#")) embed.setColor(`#${color}`);
			else embed.setColor(color as ColorResolvable);
		}
		if (footer) embed.setFooter({ text: footer });
		if (image) embed.setImage(image);
		if (thumbnail) embed.setThumbnail(thumbnail);

		return interaction.channel.send({ embeds: [embed] });
	},
});
