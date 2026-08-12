import { defineCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { tileToAttachment, TileShape, TileRandom } from "@images/tile";
import getImage, { imageNotFound } from "@images/getImage";
import { magnifyButtons, tileButtons } from "@utility/buttons";
import { imageTooBig } from "@helpers/warnUser";
import addDeleteButton from "@utility/addDeleteButton";

export default defineCommand({
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
					// only horizontal because mc doesn't use vertical flipping
					{ name: "flip", value: "flip" },
					{ name: "none", value: "none" },
				),
		)
		.addStringOption((option) =>
			option
				.setName("shape")
				.setDescription("How the image should be tiled.")
				.setRequired(false)
				.addChoices(
					{ name: "grid", value: "grid" },
					{ name: "vertical", value: "vertical" },
					{ name: "horizontal", value: "horizontal" },
					{ name: "plus", value: "plus" },
				),
		)
		.addNumberOption((option) =>
			option
				.setName("size")
				.setDescription("Grid size to use (default 3x3)")
				.setRequired(false)
				.setMinValue(2)
				.setMaxValue(9),
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
		const shape = interaction.options.getString("shape") as TileShape;

		// returns null instead of undefined which causes destructuring issues later (pain)
		const gridSize = interaction.options.getNumber("size", false) ?? undefined;
		const magnify = interaction.options.getBoolean("magnify", false) ?? true;

		await interaction.deferReply();

		const image = await getImage(interaction);
		if (!image) return imageNotFound(interaction);

		const file = await tileToAttachment(image, { random, shape, gridSize, magnify });
		if (!file) return imageTooBig(interaction);

		await interaction.editReply({
			files: [file],
			// don't add mirror/flip with bigger grid size (stupid hack)
			components: addDeleteButton([gridSize === undefined ? tileButtons : magnifyButtons]),
		});
	},
});
