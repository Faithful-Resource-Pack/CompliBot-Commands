import { defineEvent } from "@interfaces/events";
import type { BotBans } from "@interfaces/interactions";
import { MessageFlags } from "discord.js";

export default defineEvent({
	name: "interactionCreate",
	async execute(client, interaction) {
		if (!interaction.inGuild()) return;

		const banlist = await import("@json/botbans.json").then<BotBans>((res) => res.default);
		// all interactions except autocomplete have the string() and reply() methods
		if (banlist.ids.includes(interaction.user.id) && !interaction.isAutocomplete()) {
			return interaction.reply({
				content: interaction.strings().error.botbanned,
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
