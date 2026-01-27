import type { SlashCommand } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";
import { SlashCommandBuilder } from "discord.js";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("guidelines")
		.setDescription("Shows various Faithful texturing guidelines.")
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("The guidelines you want to view")
				.addChoices(
					{ name: "Faithful 32x", value: "faithful_32x" },
					{ name: "Faithful 64x", value: "faithful_64x" },
					{ name: "Classic Faithful 32x", value: "classic_faithful_32x" },
				)
				.setRequired(true),
		),
	async execute(interaction) {
		const pack = interaction.options.getString("pack", true);

		const guidelines = {
			faithful_32x: "https://docs.faithfulpack.net/pages/textures/f32-texturing-guidelines",
			faithful_64x: "https://docs.faithfulpack.net/pages/textures/f64-texturing-guidelines",
			classic_faithful_32x:
				"https://docs.faithfulpack.net/pages/textures/cf32-texturing-guidelines",
		};

		return interaction.reply({ content: guidelines[pack], components: addDeleteButton() });
	},
};
