import { Message, EmbedBuilder } from "@client";
import type { AnyInteraction } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";
import { colors } from "@utility/colors";
import { InteractionReplyOptions, MessageFlags } from "discord.js";

export async function warnUser(
	interaction: AnyInteraction | Message,
	title: string,
	description: string,
) {
	const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(colors.red);
	if (interaction instanceof Message)
		return interaction.reply({ embeds: [embed], components: addDeleteButton() });

	// no need for delete button because it's guaranteed ephemeral
	const options: InteractionReplyOptions = {
		embeds: [embed],
		flags: MessageFlags.Ephemeral,
	};

	try {
		await interaction.reply(options);
	} catch {
		// deferred
		await interaction.ephemeralReply(options);
	}
}

/**
 * Warn a user that a provided image is too large to perform an action
 * @author Evorp
 * @param interaction interaction to reply to
 */
export function imageTooBig(interaction: AnyInteraction | Message) {
	// force english if it's a message
	const imageStrings = interaction.strings(interaction instanceof Message).error.image;
	return warnUser(interaction, imageStrings.too_big, imageStrings.max_size);
}
