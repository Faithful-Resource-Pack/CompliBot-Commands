import type { SlashCommand } from "@interfaces/interactions";
import { EmbedBuilder } from "@client";
import { SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { colors } from "@utility/colors";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("define")
		.setDescription(`Define a texturing term using the Faithful Glossary.`)
		.addStringOption((option) =>
			option.setName("term").setDescription("Term to define").setRequired(true),
		),
	async execute(interaction) {
		await interaction.deferReply();
		const choice = interaction.options.getString("term", true).trim();

		// easier to read markdown than final compiled site
		const terms = (
			await axios.get<string>(
				"https://raw.githubusercontent.com/Faithful-Resource-Pack/Docs/main/pages/textures/glossary.md",
			)
		).data.split("\n\n#");

		// use partial title match
		const match = terms.find((term) => new RegExp(`# .*${choice}.*`, "i").exec(term));

		const errorEmbed = new EmbedBuilder()
			.setTitle(interaction.strings().error.invalid_choice.title)
			.setDescription(
				interaction.strings().error.invalid_choice.description.replace("%CHOICE%", choice),
			)
			.setColor(colors.red);

		if (!match)
			return interaction.ephemeralReply({
				embeds: [errorEmbed],
			});

		const [title, ...rest] = match.split("\n\n");
		const escapedTitle = title.replace(/#+ */g, "");
		const text = rest.filter((v) => !v.startsWith("<")).join("\n\n");

		// if there's a header and no body or something like that
		if (!escapedTitle || !text) {
			return interaction.ephemeralReply({
				embeds: [errorEmbed],
			});
		}

		const question = (
			await axios.get<string>(`${interaction.client.tokens.apiUrl}settings/images.question`)
		).data;

		const finalEmbed = new EmbedBuilder()
			.setTitle(escapedTitle)
			.setDescription(text)
			.setThumbnail(question)
			.setURL(
				`https://docs.faithfulpack.net/pages/textures/glossary#${escapedTitle.toLowerCase().replace(/ /g, "-")}`,
			);

		return interaction.editReply({ embeds: [finalEmbed], components: addDeleteButton() });
	},
};
