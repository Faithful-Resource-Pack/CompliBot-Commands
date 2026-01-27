import type { Component } from "@interfaces/components";
import { info } from "@helpers/logger";
import { ButtonInteraction, EmbedBuilder } from "@client";
import { tileToAttachment, untile } from "@images/tile";
import { palette, flip, tile } from "@utility/buttons";
import getImage, { imageNotFound } from "@images/getImage";
import { imageTooBig } from "@helpers/warnUser";
import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	id: "rotate",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Image was rotated!`);

		const message = interaction.message;
		const url = await getImage(message);
		if (!url) return imageNotFound(interaction);
		const image = await untile(url);
		const attachment = await tileToAttachment(image, { random: "rotation", magnify: true });

		if (!attachment) return imageTooBig(interaction);

		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setImage(`attachment://${attachment.name}`)
					.setFooter({ text: `${interaction.user.username} | ${interaction.user.id}` })
					.setTimestamp(),
			],
			files: [attachment],
			components: addDeleteButton(
				[new ActionRowBuilder<ButtonBuilder>().addComponents(tile, flip, palette)],
				true,
			),
		});
	},
} as Component<ButtonInteraction>;
