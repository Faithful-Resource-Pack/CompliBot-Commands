import { type BotBans, defineCommand } from "@interfaces/interactions";
import { EmbedBuilder } from "@client";
import {
	AttachmentBuilder,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { colors } from "@utility/colors";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("botban")
		.setDescription("Manage the ban list (devs naughty list :D).")
		.addSubcommand((view) =>
			view
				.setName("view")
				.setDescription("View the botban list")
				.addStringOption((option) =>
					option
						.setName("format")
						.setDescription("The format the ban list should be displayed in (default is text).")
						.setRequired(false)
						.addChoices(
							{ name: "JSON", value: "json" },
							{ name: "Embed", value: "embed" },
							{ name: "Text", value: "text" },
							{ name: "Mentions", value: "mentions" },
						),
				),
		)
		.addSubcommand((edit) =>
			edit
				.setName("edit")
				.setDescription("Change the banlist")
				.addUserOption((option) =>
					option
						.setName("subject")
						.setDescription("The user to edit the permissions of.")
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("action")
						.setDescription("What to do with this user")
						.addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" })
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setDMPermission(false),
	execute: {
		async edit(interaction) {
			const isAdding = interaction.options.getString("action", true) == "add";

			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			const banlist: BotBans = require("@json/botbans.json");
			const victim = interaction.options.getUser("subject", true);

			if (
				interaction.client.tokens.developers.includes(victim.id) ||
				interaction.hasPermission("moderator", false) ||
				victim.id == interaction.client.user.id // self
			)
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle(interaction.strings().command.botban.unbannable.title)
							.setDescription(interaction.strings().command.botban.unbannable.description)
							.setColor(colors.red),
					],
				});

			writeFileSync(
				join(process.cwd(), "json", "botbans.json"),
				JSON.stringify(
					isAdding
						? banlist.ids.concat([victim.id])
						: banlist.ids.filter((id: string) => id != victim.id),
				),
			);

			interaction.editReply({
				embeds: [
					new EmbedBuilder().setDescription(
						`<@${victim.id}> has been ${isAdding ? "botbanned" : "un-botbanned"}.`,
					),
				],
			});
		},
		async view(interaction) {
			if (!interaction.hasPermission("dev")) return;

			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			const buffer = readFileSync(join(process.cwd(), "json", "botbans.json"), {
				encoding: "utf8",
			});
			const ids: string[] = JSON.parse(buffer).ids;
			const txtBuff = Buffer.from(`Botbanned IDs:\n\n${ids.join("\n")}`, "utf-8");

			// curly brackets used to fix scoping issues
			switch (interaction.options.getString("format")) {
				case "json": {
					return interaction.editReply({
						files: [new AttachmentBuilder(buffer, { name: "bans.json" })],
					});
				}
				case "embed": {
					const embed = new EmbedBuilder()
						.setTitle("Botbanned IDs:")
						.setDescription(ids.join("\n"));
					return interaction.editReply({ embeds: [embed] });
				}
				case "mentions": {
					const pingEmbed = new EmbedBuilder()
						.setTitle("Botbanned Users:")
						.setDescription(ids.map((id) => `<@${id}>`).join("\n"));
					return interaction.editReply({ embeds: [pingEmbed] });
				}
				default: {
					// also text
					interaction.editReply({
						files: [new AttachmentBuilder(txtBuff, { name: "bans.txt" })],
					});
				}
			}
		},
	},
});
