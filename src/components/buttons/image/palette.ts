import type { Component } from "@interfaces/components";
import { info } from "@helpers/logger";
import { ButtonInteraction } from "@client";
import { paletteToAttachment } from "@images/palette";
import getImage, { imageNotFound } from "@images/getImage";
import { imageTooBig } from "@helpers/warnUser";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	id: "palette",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Image palette was requested!`);

		const message = interaction.message;
		const url = await getImage(message);
		if (!url) return imageNotFound(interaction);
		const [file, embed] = await paletteToAttachment(url);

		if (!file || !embed) return imageTooBig(interaction);

		return interaction.reply({
			embeds: [
				embed
					.setFooter({ text: `${interaction.user.username} | ${interaction.user.id}` })
					.setTimestamp(),
			],
			files: [file],
			components: addDeleteButton([], true),
		});
	},
} as Component<ButtonInteraction>;
