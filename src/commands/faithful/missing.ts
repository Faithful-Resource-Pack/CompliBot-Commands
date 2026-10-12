import { defineCommand } from "@interfaces/interactions";
import type { MinecraftEdition, Pack } from "@interfaces/database";
import { EmbedBuilder } from "@client";
import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import computeMissing, { updateProgressChannel, MissingEdition } from "@functions/computeMissing";
import axios from "axios";
import formatPack from "@utility/formatPack";
import addDeleteButton from "@utility/addDeleteButton";

export default defineCommand({
	async data(client) {
		const packs = await axios
			.get<Pack[]>(`${client.tokens.apiUrl}packs/search?type=submission`)
			.then((res) => res.data);
		return new SlashCommandBuilder()
			.setName("missing")
			.setDescription("Displays the missing textures for a particular resource pack")
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
					.setDescription("Also scan modded textures (e.g. Forge, Fabric).")
					.setRequired(false),
			)
			.addBooleanOption((option) =>
				option
					.setName("nonvanilla")
					.setDescription("Show nonvanilla textures in addition to the missing list.")
					.setRequired(false),
			);
	},
	async execute(interaction) {
		await interaction.deferReply();

		const pack = interaction.options.getString("pack", true);
		const edition = interaction.options.getString("edition", true) as MissingEdition;
		const version = interaction.options.getString("version") ?? "latest";
		const checkModded = interaction.options.getBoolean("modded", false) ?? false;

		const [loadingImage, progressData] = await Promise.all([
			axios
				.get<string>(`${interaction.client.tokens.apiUrl}settings/images.loading`)
				.then((res) => res.data),
			axios
				// { pack: { edition: <channel id> } }
				.get<Record<string, Record<MinecraftEdition, string>>>(
					`${interaction.client.tokens.apiUrl}settings/discord.channels.pack_progress`,
				)
				.then((res) => res.data[pack]),
		]);

		const loadingEmbed = new EmbedBuilder()
			.setTitle("Searching for missing textures…")
			.setDescription("This can take some time, please wait…")
			.setThumbnail(loadingImage)
			.addFields({ name: "Steps", value: "\u200b" });

		await interaction.editReply({ embeds: [loadingEmbed], components: addDeleteButton() });

		const steps: string[] = [];
		const responses = await computeMissing(
			interaction.client,
			pack,
			edition,
			version,
			checkModded,
			// update embed with new step after each call
			async (step: string) => {
				steps.push(step || "No step name provided…");
				loadingEmbed.spliceFields(0, 1, { name: "Steps", value: steps.join("\n") });
				await interaction.editReply({ embeds: [loadingEmbed] }).catch(() => {});
			},
		);

		const packName = formatPack(pack).name;
		const resultEmbed = new EmbedBuilder().setTimestamp();
		const files: AttachmentBuilder[] = [];

		// including modded textures creates a separate less useful percentage
		const doUpdateChannels = version === "latest" && !checkModded;
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
				files.push(new AttachmentBuilder(res.files.diff, { name: `missing-${slug}.txt` }));

			// the compute function takes so many args it's easier to always compute and check here lol
			if (interaction.options.getBoolean("nonvanilla", false) && res.files.nonvanilla)
				files.push(new AttachmentBuilder(res.files.nonvanilla, { name: `nonvanilla-${slug}.txt` }));

			const { percentage, missing, total } = res.stats;
			resultEmbed.addFields({
				name: `${packInfo} is ${percentage}% complete!`,
				value: `> Missing ${missing} of ${total} textures.`,
			});
		}

		return Promise.all([
			interaction.editReply({ embeds: [resultEmbed], files }).catch(() => {}),
			...channelUpdateProms,
		]);
	},
});
