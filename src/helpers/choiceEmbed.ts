import { EmbedBuilder, StringSelectMenuInteraction } from "@client";
import {
	ActionRowBuilder,
	SelectMenuComponentOptionData,
	StringSelectMenuBuilder,
} from "discord.js";
import type { Texture } from "@interfaces/database";
import versionRange from "@utility/versionRange";
import axios from "axios";
import type { AnyInteraction } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";

// todo: look into the actual length (you can go a bit higher than this and it still works)
export const MAX_LENGTH = 6000;
// 5 - 1 for delete button row
export const MAX_ROWS = 4;
export const MAX_CHOICE_PER_ROW = 25;

/**
 * Construct custom choice embed with any given results
 * @author Juknum, Evorp
 * @param interaction interaction to reply to
 * @param menuID which id the result gets sent to
 * @param choices pre-formatted choices to add in the menus
 */
export async function generalChoiceEmbed(
	interaction: AnyInteraction,
	menuID: string,
	choices: SelectMenuComponentOptionData[],
) {
	const emojis = (
		await axios.get<string[]>(`${interaction.client.tokens.apiUrl}settings/emojis.default_select`)
	).data;

	const menuLength = Math.min(MAX_CHOICE_PER_ROW, emojis.length);

	let messageLength = 0;
	let resultCount = 0;

	const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
	for (let currentRow = 0; currentRow < MAX_ROWS; ++currentRow) {
		const options = choices
			// take relevant slice (end not included)
			.slice(currentRow * menuLength, (1 + currentRow) * menuLength)
			.reduce<SelectMenuComponentOptionData[]>((acc, cur, i) => {
				messageLength += cur.label.length + (cur.description?.length ?? 0);
				// stop accepting new
				if (messageLength > MAX_LENGTH) return acc;
				acc.push({ ...cur, emoji: emojis[i] });
				return acc;
			}, []);

		// hit char limit or all options have been exhausted
		if (!options.length) break;
		resultCount += options.length;

		const menu = new StringSelectMenuBuilder()
			.setCustomId(`${menuID}_${currentRow}`)
			.setPlaceholder("Select an option…")
			.addOptions(options);

		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
	}

	const embed = new EmbedBuilder()
		.setTitle(`${choices.length} results found`)
		.setDescription("If you can't find what you're looking for, please be more specific!");

	if (messageLength > MAX_LENGTH)
		embed.setTitle(`Showing 1–${resultCount} of ${choices.length} results`);

	return interaction.editReply({ embeds: [embed], components: addDeleteButton(components) });
}

/**
 * Construct choice embed when there's multiple textures to pick from
 * @author Juknum
 * @param interaction interaction to reply to
 * @param menuID which id the result gets sent to
 * @param results textures to embed
 * @param values extra info to send to the menuID
 */
export async function textureChoiceEmbed(
	interaction: AnyInteraction,
	menuID: string,
	results: Texture[],
	...values: string[]
) {
	const mappedResults = results.map<SelectMenuComponentOptionData>(({ id, name, paths }) => ({
		// usually the first path is the most important
		label: `[#${id}] ${name} (${versionRange(paths[0].versions)})`,
		description: paths[0].name,
		value: `${id}__${values.join("__")}`,
	}));

	return generalChoiceEmbed(interaction, menuID, mappedResults);
}

/**
 * Convert interaction from choice embed into chosen option
 * @author Evorp
 * @param interaction interaction to unencode
 * @returns chosen value (texture choice embeds always have the texture ID first)
 */
export const unencodeChoice = (interaction: StringSelectMenuInteraction) =>
	interaction.values[0].split("__");
