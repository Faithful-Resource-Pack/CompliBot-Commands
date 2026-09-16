import { defineComponent } from "@interfaces/components";
import { info } from "@helpers/logger";
import { ButtonInteraction, EmbedBuilder } from "@client";
import { magnifyToAttachment } from "@images/magnify";
import { parseDisplay } from "@functions/compareTexture";
import formatPack from "@utility/formatPack";
import { Image, loadImage } from "@napi-rs/canvas";
import stitch from "@helpers/images/stitch";
import { MessageFlags } from "discord.js";

export default defineComponent<ButtonInteraction>({
	id: "comparisonTemplate",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Comparison template requested!`);
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const message = interaction.message;
		const display = message.embeds[0].footer?.text.split(":")[1].trim();
		const packs = parseDisplay(display);

		const loadedImages = await Promise.all(
			packs.map((packSet) =>
				Promise.all(packSet.map((pack) => loadImage(formatPack(pack, 64).iconURL))),
			),
		);

		// gaps are size of one 16x "pixel" always
		const stitched = await stitch(loadedImages, 32);
		const magnified = await magnifyToAttachment(stitched);

		const embed = new EmbedBuilder()
			.setTitle(interaction.strings().command.compare.comparison_template)
			.setImage("attachment://magnified.png");

		return interaction.editReply({ embeds: [embed], files: [magnified] });
	},
});
