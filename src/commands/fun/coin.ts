import type { SlashCommand } from "@interfaces/interactions";
import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import { reflip } from "@utility/buttons";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("coin")
		.setDescription("Flip a coin. Will it be heads? Will it be tails? Who knows?"),
	async execute(interaction) {
		const res = Math.round(Math.random() * 100) / 100; // round to 2 decimal places

		const embed = new EmbedBuilder()
			.setTitle(res > 0.5 ? "Heads" : res < 0.5 ? "Tails" : "Edge?!")
			.setThumbnail(
				`https://database.faithfulpack.net/images/bot/${
					res > 0.5 ? "coin_heads" : res < 0.5 ? "coin_tails" : "coin_edge"
				}.png?w=240&enlarge=1`,
			)
			.setColor(colors.coin);

		interaction.reply({
			embeds: [embed],
			components: addDeleteButton([new ActionRowBuilder<ButtonBuilder>().addComponents(reflip)]),
		});
	},
};
