import type { SlashCommand } from "@interfaces/interactions";
import type { Pack } from "@interfaces/database";
import { SlashCommandBuilder } from "discord.js";
import { getTexture } from "@functions/getTexture";
import parseTextureName from "@functions/parseTextureName";
import { textureChoiceEmbed } from "@helpers/choiceEmbed";
import axios from "axios";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	async data(client) {
		const packs = await axios
			.get<Pack[]>(`${client.tokens.apiUrl}packs/raw`)
			.then((res) => res.data);
		return new SlashCommandBuilder()
			.setName("texture")
			.setDescription("Displays a specified texture from either vanilla Minecraft or Faithful.")
			.addStringOption((option) =>
				option.setName("name").setDescription("Texture name or ID to search.").setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName("pack")
					.setDescription("Resource pack to display.")
					.addChoices(...Object.values(packs).map((pack) => ({ name: pack.name, value: pack.id })))
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName("version")
					.setDescription("Version of the searched texture (defaults to latest).")
					.setAutocomplete(true) // autocomplete is handled in the event file itself
					.setRequired(false),
			);
	},
	async execute(interaction) {
		const name = interaction.options.getString("name", true);
		let version = interaction.options.getString("version", false) ?? "latest";

		// fetching takes too long for big results
		await interaction.deferReply();
		const results = await parseTextureName(name, interaction);

		// no results or invalid search
		if (!results) return;

		// latest version if versions doesn't include version (fix for autocomplete validation)
		if (!interaction.client.versions.includes(version)) version = "latest";

		// only one result
		if (results.length === 1) {
			const replyOptions = await getTexture(
				interaction,
				results[0],
				interaction.options.getString("pack", true),
				version,
			);

			// no results found
			if (!replyOptions.files) return interaction.ephemeralReply(replyOptions);
			return interaction.editReply({
				...replyOptions,
				components: addDeleteButton(replyOptions.components),
			});
		}

		// multiple results
		return textureChoiceEmbed(
			interaction,
			"textureSelect",
			results,
			interaction.options.getString("pack", true),
			version,
		);
	},
};
