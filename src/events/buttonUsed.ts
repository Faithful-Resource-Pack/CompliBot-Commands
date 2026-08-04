import { defineEvent } from "@interfaces/events";
import { ButtonInteraction, EmbedBuilder } from "@client";
import { info } from "@helpers/logger";
import { colors } from "@utility/colors";
import { MessageFlags } from "discord.js";

export default defineEvent({
	name: "buttonUsed",
	async execute(client, interaction: ButtonInteraction) {
		client.storeAction("button", interaction);

		if (client.verbose) console.log(`${info}Button used!`);

		if (interaction.customId.startsWith("pollVote__")) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.generic)
						.setDescription(interaction.strings().error.polls_removed)
						.setColor(colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const button = client.buttons.get(interaction.customId);
		if (button) return button.execute(client, interaction);
	},
});
