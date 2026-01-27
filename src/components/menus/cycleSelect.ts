import { StringSelectMenuInteraction, EmbedBuilder } from "@client";
import type { Component } from "@interfaces/components";
import { info } from "@helpers/logger";
import { cycleTexture } from "@functions/cycleTexture";
import { colors } from "@utility/colors";
import { unencodeChoice } from "@helpers/choiceEmbed";
import { MessageFlags } from "discord.js";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	id: "cycleSelect",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Texture selected!`);

		const messageInteraction = interaction.message.interactionMetadata;
		if (!messageInteraction) return; // something has gone very wrong
		const message = interaction.message;

		if (interaction.user.id !== messageInteraction.user.id)
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.permission.notice)
						.setDescription(
							interaction
								.strings()
								.error.permission.user_locked.replace("%USER%", `<@${messageInteraction.user.id}>`),
						)
						.setColor(colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});

		interaction.deferUpdate();

		const [id, display, framerate] = unencodeChoice(interaction);
		const editOptions = await cycleTexture(interaction.client, id, display, Number(framerate));
		message.edit({ ...editOptions, components: addDeleteButton(editOptions.components) });
	},
} as Component<StringSelectMenuInteraction>;
