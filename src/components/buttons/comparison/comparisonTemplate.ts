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

		const loadedImages: Image[][] = [];
		for (const packSet of packs) {
			loadedImages.push([]);
			for (const pack of packSet) {
				loadedImages.at(-1).push(await loadImage(formatPack(pack, 64).iconURL));
			}
		}

		const stitched = await stitch(loadedImages);
		const magnified = await magnifyToAttachment(stitched);

		const embed = new EmbedBuilder()
			.setImage("attachment://magnified.png")
			.setTitle(`Comparison Template`);

		return interaction.editReply({
			embeds: [embed],
			files: [magnified],
		});
	},
});
