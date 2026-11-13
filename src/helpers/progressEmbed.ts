import { EmbedBuilder } from "@client";
import { AnyInteraction } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";

export type ProgressCallback = (step?: string) => Promise<void>;

/**
 * Show a progress embed with a series of steps
 * @author Evorp
 * @param interaction interaction to reply to
 * @param embed Can provide either the full embed or just a title override
 * @param useSteps Whether to add a "Steps" field that gets updated when the callback is called
 * @returns Step callback if useSteps is enabled
 */
export default async function progressEmbed(
	interaction: AnyInteraction,
	embed: EmbedBuilder | string,
	useSteps = true,
): Promise<ProgressCallback> {
	const steps = [];
	const defaultEmbed = new EmbedBuilder()
		.setDescription("This can take some time, please wait…")
		.setThumbnail("https://database.faithfulpack.net/images/bot/loading.gif");

	const loadingEmbed = typeof embed === "string" ? defaultEmbed.setTitle(embed) : embed;
	if (useSteps) loadingEmbed.addFields({ name: "Steps", value: "\u200b" });

	if (interaction.deferred)
		await interaction.editReply({ embeds: [loadingEmbed], components: addDeleteButton() });
	else await interaction.reply({ embeds: [loadingEmbed], components: addDeleteButton() });

	// callback gets reused in /missing etc
	return async (step?: string) => {
		steps.push(step || "No step name provided…");

		// since we always add the steps field last it's safe to access by index
		loadingEmbed.spliceFields(-1, 1, { name: "Steps", value: steps.join("\n") });
		await interaction.editReply({ embeds: [loadingEmbed] }).catch(() => {});
	};
}
