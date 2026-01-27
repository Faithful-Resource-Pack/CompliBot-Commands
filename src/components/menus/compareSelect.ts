import { StringSelectMenuInteraction, EmbedBuilder } from "@client";
import type { Component } from "@interfaces/components";
import { info } from "@helpers/logger";
import { MessageFlags } from "discord.js";
import compareTexture from "@functions/compareTexture";
import { imageTooBig } from "@helpers/warnUser";
import { colors } from "@utility/colors";
import { unencodeChoice } from "@helpers/choiceEmbed";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	id: "compareSelect",
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

		const [id, display, version] = unencodeChoice(interaction);
		const editOptions = await compareTexture(interaction.client, id, display, version);

		if (!editOptions) {
			// stupid workaround for already having deferred the message
			await interaction.deleteReply();
			return imageTooBig(interaction);
		}

		message.edit({ ...editOptions, components: addDeleteButton(editOptions.components) });
	},
} as Component<StringSelectMenuInteraction>;
