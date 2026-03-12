import axios from "axios";
import { EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import type { Texture } from "@interfaces/database";
import type { AnyInteraction } from "@interfaces/interactions";

/**
 * Validate and parse a texture name into a series of texture objects
 * @author Evorp, Juknum
 * @param name texture name or id
 * @param interaction what to reply to if not possible
 * @returns texture results
 */
export default async function parseTextureName(
	name: string,
	interaction: AnyInteraction,
): Promise<Texture[] | undefined> {
	name = name.trim().replace(".png", "").replace("#", "").replace(/ /g, "_");

	const noResultEmbed = new EmbedBuilder()
		.setTitle(interaction.strings().error.texture.no_results.title)
		.setDescription(
			interaction
				.strings()
				.error.texture.no_results.description.replace("%TEXTURENAME%", `\`${name}\``),
		)
		.setColor(colors.red);

	// commas are used to separate bulk searches, causes schema mismatch issues
	if (name.includes(",")) {
		interaction.ephemeralReply({ embeds: [noResultEmbed] });
		return;
	}

	let results: Texture | Texture[];
	try {
		results = (
			await axios.get(`${interaction.client.tokens.apiUrl}textures/${encodeURIComponent(name)}/all`)
		).data;
	} catch {
		// invalid request
		await interaction.ephemeralReply({ embeds: [noResultEmbed] });
		return;
	}

	// texture id returns single result, wrap in array for easier handling
	const out = Array.isArray(results) ? results : [results];

	if (!out.length) {
		await interaction.ephemeralReply({
			embeds: [noResultEmbed],
		});
		return;
	}

	return out;
}
