import { defineCommand } from "@interfaces/interactions";
import type { MinecraftEdition, Pack } from "@interfaces/database";
import { EmbedBuilder } from "@client";
import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import computeMissing, { updateProgressChannel, MissingEdition } from "@functions/computeMissing";
import axios from "axios";
import formatPack from "@utility/formatPack";
import progressEmbed from "@helpers/progressEmbed";

export default defineCommand({
	async data(client) {
		const packs = await axios
			.get<Pack[]>(`${client.tokens.apiUrl}packs/search?type=submission`)
			.then((res) => res.data);
		return new SlashCommandBuilder()
			.setName("missing")
			.setDescription("Displays missing textures for a particular resource pack and version.")
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
			)
			.addBooleanOption((option) =>
				option
					.setName("modded")
					.setDescription("Also scan modded textures, for Fabric, Forge, and Mod Menu support.")
					.setRequired(false),
			)
			.addBooleanOption((option) =>
				option
					.setName("mers")
					.setDescription("Also scan Bedrock MERS textures, for Vibrant Visuals support.")
					.setRequired(false),
			);
	},
	async execute(interaction) {
		await interaction.deferReply();

		const pack = interaction.options.getString("pack", true);
		const edition = interaction.options.getString("edition", true) as MissingEdition;
		const version = interaction.options.getString("version") ?? "latest";
		const checkModded = interaction.options.getBoolean("modded", false) ?? false;
		const checkMers = interaction.options.getBoolean("mers", false) ?? false;

		const progressData = (
			await axios.get<Record<MinecraftEdition, string>>(
				`${interaction.client.tokens.apiUrl}settings/discord.channels.pack_progress.${pack}`,
			)
		).data;

		const onProgress = await progressEmbed(interaction, "Searching for missing textures…");

		const responses = await computeMissing(
			interaction.client,
			pack,
			edition,
			version,
			{ modded: checkModded, mers: checkMers },
			onProgress,
		);

		const packName = formatPack(pack).name;
		const resultEmbed = new EmbedBuilder().setTimestamp();
		const files: AttachmentBuilder[] = [];

		// including modded/mers textures creates a separate less useful percentage
		const doUpdateChannels = version === "latest" && !checkModded && !checkMers;
		const channelUpdateProms: Promise<void>[] = [];

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

			// non-blocking, await at end
			if (doUpdateChannels)
				channelUpdateProms.push(updateProgressChannel(interaction.client, progressData, res));

			const slug = `${pack.replace(/_/g, "-")}-${res.data.edition}`;
			if (res.stats.missing)
				files.push(new AttachmentBuilder(res.files.missing, { name: `missing-${slug}.txt` }));

			const { total, missing, missingPercentage } = res.stats;
			resultEmbed.addFields({
				name: `${packInfo} is ${missingPercentage}% complete!`,
				value: `> Missing ${missing} of ${total} textures.`,
			});
		}

		return Promise.all([
			interaction.editReply({ embeds: [resultEmbed], files }).catch(() => {}),
			...channelUpdateProms,
		]);
	},
});
