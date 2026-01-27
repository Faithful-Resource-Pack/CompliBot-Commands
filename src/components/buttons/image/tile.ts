import type { Component } from "@interfaces/components";
import { info } from "@helpers/logger";
import { ButtonInteraction, EmbedBuilder } from "@client";
import { tileToAttachment } from "@images/tile";
import { tileButtons } from "@utility/buttons";
import getImage, { imageNotFound } from "@images/getImage";
import { imageTooBig } from "@helpers/warnUser";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	id: "tile",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Image was tiled!`);

		const message = interaction.message;
		const url = await getImage(message);
		if (!url) return imageNotFound(interaction);
		const attachment = await tileToAttachment(url);

		if (!attachment) return imageTooBig(interaction);

		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setImage(`attachment://${attachment.name}`)
					.setFooter({ text: `${interaction.user.username} | ${interaction.user.id}` })
					.setTimestamp(),
			],
			files: [attachment],
			components: addDeleteButton([tileButtons], true),
		});
	},
} as Component<ButtonInteraction>;
