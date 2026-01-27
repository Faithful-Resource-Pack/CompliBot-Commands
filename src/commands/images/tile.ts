import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { tileToAttachment, TileShape, TileRandom } from "@images/tile";
import getImage, { imageNotFound } from "@images/getImage";
import { tileButtons } from "@utility/buttons";
import { imageTooBig } from "@helpers/warnUser";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("tile")
		.setDescription("Tile an image")
		.addStringOption((option) =>
			option
				.setName("random")
				.setDescription("Whether individual tiles should be randomly rotated or flipped.")
				.setRequired(false)
				.addChoices(
					{ name: "rotation", value: "rotation" },
					{ name: "flip", value: "flip" }, // only horizontal because mc doesn't use vertical flipping
				),
		)
		.addStringOption((option) =>
			option
				.setName("type")
				.setDescription("How the image should be tiled.")
				.setRequired(false)
				.addChoices(
					{ name: "grid", value: "grid" },
					{ name: "vertical", value: "vertical" },
					{ name: "horizontal", value: "horizontal" },
					{ name: "plus", value: "plus" },
				),
		)
		.addBooleanOption((option) =>
			option
				.setName("magnify")
				.setDescription("Whether the image should be magnified (default is true).")
				.setRequired(false),
		)
		.addAttachmentOption((o) =>
			o.setName("image").setDescription("The image to tile").setRequired(false),
		),
	async execute(interaction) {
		const random = interaction.options.getString("random") as TileRandom;
		const shape = interaction.options.getString("type") as TileShape;
		const magnify = interaction.options.getBoolean("magnify", false) ?? true;
		await interaction.deferReply();

		const image = await getImage(interaction);
		if (!image) return imageNotFound(interaction);

		const file = await tileToAttachment(image, { random, shape, magnify });
		if (!file) return imageTooBig(interaction);

		await interaction.editReply({ files: [file], components: addDeleteButton([tileButtons]) });
	},
};
