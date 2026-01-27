import type { SlashCommand } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";
import { SlashCommandBuilder } from "discord.js";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("todo")
		.setDescription("Shows various project to-do lists.")
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("The to-do list you want to view")
				.addChoices(
					{ name: "Faithful 32x", value: "faithful_32x" },
					{ name: "Faithful 64x", value: "faithful_64x" },
					{ name: "Classic Faithful 32x Jappa", value: "classic_faithful_32x" },
				)
				.setRequired(true),
		),
	async execute(interaction) {
		let content = "";
		const pack = interaction.options.getString("pack", true);
		switch (pack) {
			case "faithful_32x":
				content =
					"https://docs.google.com/document/d/1OXGHKiYJej0qvNgZWfFuYauyL1OjpL31usgK4dwuIkI/";
				break;
			case "faithful_64x":
				content =
					"https://docs.google.com/document/d/1xZ611CaVXbJ7utwnXAdk25We8n3S_du0mFuZAlNVi1U/";
				break;
			case "classic_faithful_32x":
				content =
					"https://docs.google.com/document/d/1lw5EvJhVbubNPm3ZiOXAr8Aos9gCkmz-rh03uIMuqY0/";
				break;
		}

		interaction.reply({ content, components: addDeleteButton() });
	},
};
