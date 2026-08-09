import { defineCommand } from "@interfaces/interactions";
import { EmbedBuilder } from "@client";
import { AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { colors } from "@utility/colors";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("botban")
		.setDescription("Manage the botban list (devs' naughty list >:D).")
		.addSubcommand((view) =>
			view
				.setName("view")
				.setDescription("View the botban list.")
				.addStringOption((option) =>
					option
						.setName("format")
						.setDescription("The format the ban list should be displayed in (default is text).")
						.addChoices(
							{ name: "JSON", value: "json" },
							{ name: "Embed", value: "embed" },
							{ name: "Text", value: "text" },
							{ name: "Mentions", value: "mentions" },
						)
						.setRequired(false),
				),
		)
		.addSubcommand((edit) =>
			edit
				.setName("add")
				.setDescription("Add a member to the botban list.")
				.addUserOption((option) =>
					option.setName("user").setDescription("The user to add.").setRequired(true),
				),
		)
		.addSubcommand((edit) =>
			edit
				.setName("remove")
				.setDescription("Remove a member from the botban list.")
				.addUserOption((option) =>
					option.setName("user").setDescription("The user to remove.").setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setDMPermission(false),
	execute: {
		async add(interaction) {
			// tbh I'd be amazed if this takes more than 3 seconds but it's technically I/O bound for writing
			await interaction.deferReply();
			const user = interaction.options.getUser("user", true);

			if (
				interaction.client.tokens.developers.includes(user.id) ||
				user.id === interaction.client.user.id // self
			)
				return interaction.ephemeralReply({
					embeds: [
						new EmbedBuilder()
							.setTitle(interaction.strings().command.botban.unbannable.title)
							.setDescription(interaction.strings().command.botban.unbannable.description)
							.setColor(colors.red),
					],
				});

			interaction.client.botbans.set(user.id, true);
			interaction.client.botbans.save();

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Member botbanned")
						.setDescription(`<@${user.id}> has been botbanned!`),
				],
			});
		},
		async remove(interaction) {
			await interaction.deferReply();

			const user = interaction.options.getUser("user", true);

			if (!interaction.client.botbans.has(user.id))
				return interaction.ephemeralReply({
					embeds: [
						new EmbedBuilder()
							.setTitle(interaction.strings().command.botban.not_yet_banned.title)
							.setDescription(interaction.strings().command.botban.not_yet_banned.description)
							.setColor(colors.red),
					],
				});

			interaction.client.botbans.delete(user.id);
			interaction.client.botbans.save();

			interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Member un-botbanned")
						.setDescription(`<@${user.id}> has been removed from the botban list!`),
				],
			});
		},
		async view(interaction) {
			if (!interaction.hasPermission("dev")) return;

			// no need to defer since the collection is already preloaded when the bot starts
			const ids = Array.from(interaction.client.botbans.keys());

			// curly brackets used to fix scoping issues
			switch (interaction.options.getString("format")) {
				case "json": {
					return interaction.reply({
						files: [
							new AttachmentBuilder(Buffer.from(JSON.stringify(ids, null, 4)), {
								name: "botbans.json",
							}),
						],
					});
				}
				case "embed": {
					const embed = new EmbedBuilder()
						.setTitle("Botbanned IDs")
						.setDescription(ids.join("\n") || "No users are currently botbanned!");
					return interaction.reply({ embeds: [embed] });
				}
				case "mentions": {
					const pingEmbed = new EmbedBuilder()
						.setTitle("Botbanned Users")
						.setDescription(
							ids.map((id) => `<@${id}>`).join("\n") || "No users are currently botbanned!",
						);
					return interaction.reply({ embeds: [pingEmbed] });
				}
				default: {
					interaction.reply({
						files: [
							new AttachmentBuilder(
								Buffer.from(
									`Botbanned IDs:\n${ids.join("\n") || "No users are currently botbanned!"}`,
								),
								{
									name: "bans.txt",
								},
							),
						],
					});
				}
			}
		},
	},
});
