import type { SlashCommand } from "@interfaces/interactions";
import { EmbedBuilder } from "@client";
import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import axios from "axios";
import formatPack from "@utility/formatPack";
import type { Pack } from "@interfaces/database";
import { colors } from "@utility/colors";
import getContributions from "@functions/getContributions";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	async data(client) {
		const packs = (await axios.get<Pack[]>(`${client.tokens.apiUrl}packs/search?type=submission`))
			.data;
		return new SlashCommandBuilder()
			.setName("contributions")
			.setDescription("Shows a given user's contributions")
			.addUserOption((option) =>
				option
					.setName("user")
					.setDescription("User you want to look up (leave blank if you want to search yourself).")
					.setRequired(false),
			)
			.addStringOption((option) =>
				option
					.setName("pack")
					.setDescription("Filter contributions for a specific pack.")
					.addChoices(...packs.map((pack) => ({ name: pack.name, value: pack.id })))
					.setRequired(false),
			)
			.addStringOption((option) =>
				option
					.setName("sort")
					.setDescription("Sort the found contributions (default is date descending).")
					.addChoices(
						{ name: "Date (newest → oldest)", value: "dateDesc" },
						{ name: "Date (oldest → newest)", value: "dateAsc" },
						{ name: "Texture ID (largest → smallest)", value: "idDesc" },
						{ name: "Texture ID (smallest → largest)", value: "idAsc" },
						{ name: "Resource Pack", value: "pack" },
					)
					.setRequired(false),
			)
			.addBooleanOption((option) =>
				option
					.setName("current")
					.setDescription("Only show current contributions (default is true)")
					.setRequired(false),
			);
	},
	async execute(interaction) {
		await interaction.deferReply();

		// defaults to the person who asked
		const user = interaction.options.getUser("user", false) ?? interaction.user;
		const pack = interaction.options.getString("pack", false);
		const sort = interaction.options.getString("sort", false) ?? "dateDesc";
		const current = interaction.options.getBoolean("current", false) ?? true;

		const response = await getContributions(interaction.client, user, pack, current, sort);
		if (!response) {
			return interaction.ephemeralReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(
							interaction
								.strings()
								.command.about.missing_profile.title.replace("%USER%", user.displayName),
						)
						.setDescription(
							// only tell user to register if they actually can register
							interaction.strings().command.about.missing_profile[
								user.id === interaction.user.id ? "register" : "description"
							],
						)
						.setColor(colors.red),
				],
			});
		}

		const embed = new EmbedBuilder().setTimestamp();
		const files: AttachmentBuilder[] = [];

		// nested ternaries were getting really ugly here
		let embedTitle = `${user.displayName} has ${response.results.length} `;
		embedTitle += current ? "current " : "total ";
		embedTitle += response.results.length === 1 ? "contribution" : "contributions";
		if (pack) embedTitle += ` in ${formatPack(pack).name}`;
		embedTitle += "!";
		embed.setTitle(embedTitle);

		if (response.count && !pack) embed.setDescription(response.count);

		let fileName = `contributions-${user.username.replace(/\.|_/g, "-")}`;
		if (pack) fileName += `-${pack.replace(/_/g, "-")}`;

		if (response.results.length)
			files.push(new AttachmentBuilder(response.file, { name: `${fileName}.txt` }));

		await interaction.editReply({ embeds: [embed], files, components: addDeleteButton() });
	},
};
