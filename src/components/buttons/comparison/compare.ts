import type { Component } from "@interfaces/components";
import { info } from "@helpers/logger";
import { ButtonInteraction } from "@client";
import compareTexture from "@functions/compareTexture";
import { imageTooBig } from "@helpers/warnUser";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	id: "compare",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Image was compared!`);

		const message = interaction.message;
		const id = message.embeds[0].title?.match(/\d+/g)?.[0];
		if (!id) return; // should be impossible
		const version = message.embeds[0].title?.match(/(?<=\()(.*?)(?=\))/g)?.[0] || "latest";

		await interaction.deferReply();
		const messageOptions = await compareTexture(client, id, "all", version);
		if (!messageOptions) return imageTooBig(interaction);

		const embed = messageOptions.embeds[0];

		messageOptions.embeds[0].setFooter(
			embed.data.footer
				? {
						text: `${embed.data.footer.text} | ${interaction.user.id}`,
						iconURL: embed.data.footer?.icon_url,
					}
				: {
						text: interaction.user.id,
					},
		);

		messageOptions.embeds[0].setTimestamp();

		return interaction.editReply({
			...messageOptions,
			components: addDeleteButton(messageOptions.components, true),
		});
	},
} as Component<ButtonInteraction>;
