import type { SlashCommand } from "@interfaces/interactions";
import type { Pack } from "@interfaces/database";
import { EmbedBuilder } from "@client";
import { SlashCommandBuilder, Message, AttachmentBuilder } from "discord.js";
import {
	computeMissingResults,
	computeAllEditions,
	MissingData,
	MissingResult,
	updateProgressChannel,
	MissingEdition,
} from "@functions/computeMissing";
import axios from "axios";
import formatPack from "@utility/formatPack";
import { toTitleCase } from "@utility/methods";

export const command: SlashCommand = {
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

		const edition = interaction.options.getString("edition", true) as MissingEdition;
		const pack = interaction.options.getString("pack", true);
		const checkModded = interaction.options.getBoolean("modded", false) ?? false;
		const version =
			edition === "bedrock"
				? "latest" // always use latest bedrock version, easier to format
				: (interaction.options.getString("version") ?? "latest");

		const updateChannels = version === "latest";

		const loading = (
			await axios.get<string>(`${interaction.client.tokens.apiUrl}settings/images.loading`)
		).data;

		const loadingEmbed = new EmbedBuilder()
			.setTitle("Searching for missing textures…")
			.setDescription("This can take some time, please wait…")
			.setThumbnail(loading)
			.addFields({ name: "Steps", value: "\u200b" });

		await interaction
			.editReply({ embeds: [loadingEmbed] })
			.then((message: Message) => message.deleteButton());
		let steps: string[] = [];

		const stepCallback = async (step: string) => {
			// when in the computing function this function is called when a step is being executed
			if (step === "") steps = ["Next one…"];
			else {
				if (steps.length === 1 && steps[0] === "Next one…") steps = [];
				steps.push(step);
			}

			loadingEmbed.spliceFields(0, 1, { name: "Steps", value: steps.join("\n") });
			await interaction.editReply({ embeds: [loadingEmbed] }).catch(() => {});
		};

		const catchErr = (err: string | Error, options: MissingData): MissingResult => {
			let errMessage = (err as Error).message;
			if (!errMessage) {
				console.error(err);
				errMessage = `An error occured when running /missing.\n\nInformation: ${err}`;
			}

			return {
				results: [errMessage],
				data: options,
			};
		};

		let responses: MissingResult[];

		if (edition === "all") {
			responses = await computeAllEditions(
				interaction.client,
				pack,
				version,
				checkModded,
				stepCallback,
			).catch((err: any) => [catchErr(err, { completion: 0, pack, version, edition })]);
		} else {
			// the args and error handling here change so we can't just switch out the args
			responses = [
				await computeMissingResults(
					interaction.client,
					pack,
					edition,
					version,
					checkModded,
					stepCallback,
				).catch((err: any) => catchErr(err, { completion: 0, pack, version, edition })),
			];
		}

		const files: AttachmentBuilder[] = [];
		const resultEmbed = new EmbedBuilder().setTimestamp();

		for (const response of responses) {
			const packName = formatPack(pack).name;
			// filter standard numbered and special versions
			const missingInfo = /\d/g.test(response.data.version)
				? `${toTitleCase(response.data.edition)} ${response.data.version}`
				: toTitleCase(response.data.version);
			const fieldTitle = `${packName} – ${missingInfo}`;

			// modded messes with the percentage so we don't update VCs if it's enabled
			if (updateChannels && !checkModded) updateProgressChannel(interaction.client, response.data);

			// no repo found for the asked pack + edition
			if (!response.diffFile) {
				resultEmbed.addFields({
					name: fieldTitle,
					// error messages are stored in response.results[0] (stupid I know)
					value: response.results[0],
				});
				continue;
			}

			if (response.results.length)
				files.push(
					new AttachmentBuilder(response.diffFile, {
						name: `missing-${pack.replace(/_/g, "-")}-${response.data.edition}.txt`,
					}),
				);

			if (response.nonvanillaFile && interaction.options.getBoolean("nonvanilla", false))
				files.push(
					new AttachmentBuilder(response.nonvanillaFile, {
						name: `nonvanilla-${pack.replace(/_/g, "-")}-${response.data.edition}.txt`,
					}),
				);

			resultEmbed.addFields({
				name: fieldTitle,
				value: `${response.data.completion}% complete:\n> ${response.results.length} ${
					response.results.length == 1 ? "texture" : "textures"
				} missing of ${response.data.total} total.`,
			});
		}

		return interaction.editReply({ embeds: [resultEmbed], files }).catch(() => {});
	},
};
