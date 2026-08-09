import { EmbedBuilder } from "@client";
import { defineEvent } from "@interfaces/events";
import { colors } from "@utility/colors";
import { MessageFlags } from "discord.js";

export default defineEvent({
	name: "interactionCreate",
	async execute(client, interaction) {
		if (!interaction.inGuild()) return;

		// all interactions except autocomplete have the string() and reply() methods
		if (client.botbans.has(interaction.user.id) && !interaction.isAutocomplete()) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.generic)
						.setDescription(interaction.strings().error.botbanned)
						.setColor(colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		// split up interactions into their own events
		if (interaction.isChatInputCommand()) return client.emit("slashCommandUsed", interaction);
		if (interaction.isAutocomplete()) return client.emit("autocomplete", interaction);
		if (interaction.isButton()) return client.emit("buttonUsed", interaction);
		if (interaction.isStringSelectMenu()) return client.emit("selectMenuUsed", interaction);
		if (interaction.isModalSubmit()) return client.emit("modalSubmit", interaction);
	},
});
