import { defineCommand } from "@interfaces/interactions";
import type { Pack } from "@interfaces/database";
import { EmbedBuilder } from "@client";
import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import computeMissing, { MissingEdition } from "@functions/computeMissing";
import axios from "axios";
import formatPack from "@utility/formatPack";
import progressEmbed from "@helpers/progressEmbed";

export default defineCommand({
	async data(client) {
		const packs = await axios
			.get<Pack[]>(`${client.tokens.apiUrl}packs/search?type=submission`)
			.then((res) => res.data);
		return new SlashCommandBuilder()
			.setName("nonvanilla")
			.setDescription("Displays the nonvanilla textures in a particular resource pack")
			.addStringOption((option) =>
				option
					.setName("pack")
					.setDescription("The resource pack.")
					.addChoices(...packs.map((pack) => ({ name: pack.name, value: pack.id })))
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName("edition")
					.setDescription("The resource pack edition.")
					.addChoices(
						{ name: "Java", value: "java" },
						{ name: "Bedrock", value: "bedrock" },
						{ name: "All", value: "all" },
					)
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName("version")
					.setDescription("The Minecraft version.")
					.setAutocomplete(true) // autocomplete is handled in the event file itself
					.setRequired(false),
			);
	},
	async execute(interaction) {
		await interaction.deferReply();

		const pack = interaction.options.getString("pack", true);
		const edition = interaction.options.getString("edition", true) as MissingEdition;
		const version = interaction.options.getString("version") ?? "latest";

		const onProgress = await progressEmbed(interaction, "Searching for nonvanilla textures…");

		// todo: split up computeMissing to only actually compute what you ask for
		const responses = await computeMissing(
			interaction.client,
			pack,
			edition,
			version,
			false,
			onProgress,
		);

		const packName = formatPack(pack).name;
		const resultEmbed = new EmbedBuilder().setTimestamp();
		const files: AttachmentBuilder[] = [];

		for (const res of responses) {
			const packInfo = `${packName} for version \`${res.data.version}\``;

			// error occurred but not the end of the world, show status and try next response
			if ("error" in res) {
				resultEmbed.addFields({
					name: `${packInfo} could not be computed!`,
					value: `> ${res.error}`,
				});
				continue;
			}

			const slug = `${pack.replace(/_/g, "-")}-${res.data.edition}`;
			if (res.stats.nonvanilla)
				files.push(new AttachmentBuilder(res.files.nonvanilla, { name: `nonvanilla-${slug}.txt` }));

			const { total, nonvanilla, nonvanillaPercentage } = res.stats;
			resultEmbed.addFields({
				name: `${packInfo} has ${nonvanillaPercentage}% nonvanilla textures!`,
				value: `> ${nonvanilla} nonvanilla of ${total} textures.`,
			});
		}

		return interaction.editReply({ embeds: [resultEmbed], files }).catch(() => {});
	},
});
