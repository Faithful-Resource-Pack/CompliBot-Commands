import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { cycleTexture } from "@functions/cycleTexture";
import parseTextureName from "@functions/parseTextureName";
import { textureChoiceEmbed } from "@helpers/choiceEmbed";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("cycle")
		.setDescription("Cycle through each resolution of a given texture as a GIF.")
		.addStringOption((option) =>
			option
				.setName("texture")
				.setDescription("Texture name or ID to cycle through.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("packs")
				.setDescription("Which set of packs you want to display.")
				.addChoices(
					{ name: "Faithful", value: "Faithful" },
					{ name: "Classic Faithful Jappa", value: "Classic Faithful Jappa" },
					{ name: "Classic Faithful Programmer Art", value: "Classic Faithful PA" },
				)
				.setRequired(true),
		)
		.addNumberOption((option) =>
			option
				.setName("framerate")
				.setDescription("Seconds between each frame (default is 1).")
				.setRequired(false),
		),
	async execute(interaction) {
		const display = interaction.options.getString("packs", true);
		const name = interaction.options.getString("texture", true);
		const framerate = interaction.options.getNumber("framerate", false) || 1;

		// sometimes it takes too long otherwise
		await interaction.deferReply();
		const results = await parseTextureName(name, interaction);

		// no results or invalid search
		if (!results) return;

		// only one result
		if (results.length === 1) {
			const replyOptions = await cycleTexture(
				interaction.client,
				results[0].id,
				display,
				framerate,
			);

			return interaction.editReply({
				...replyOptions,
				components: addDeleteButton(replyOptions.components),
			});
		}

		// multiple results
		return textureChoiceEmbed(
			interaction,
			"cycleSelect",
			results,
			display,
			framerate.toString(), // storing multiple things in value
		);
	},
};
