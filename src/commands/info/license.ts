import { defineCommand } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";
import { SlashCommandBuilder } from "discord.js";

export default defineCommand({
	data: new SlashCommandBuilder()
		.setName("license")
		.setDescription("Shows the license for the Faithful Resource Pack."),
	async execute(interaction) {
		interaction.reply({
			content: "https://faithfulpack.net/license",
			components: addDeleteButton(),
		});
	},
});
