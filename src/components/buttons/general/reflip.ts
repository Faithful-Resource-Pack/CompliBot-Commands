import { defineComponent } from "@interfaces/components";
import { ButtonInteraction, EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import { info } from "@helpers/logger";
import { MessageFlags } from "discord.js";

export default defineComponent<ButtonInteraction>({
	id: "reflip",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Coin re-flipped!`);

		const messageInteraction = interaction.message.interactionMetadata;
		const message = interaction.message;

		if (messageInteraction != undefined && interaction.user.id != messageInteraction.user.id)
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

		const res = Math.round(Math.random() * 100) / 100; // round to 2 decimal places

		const embed = EmbedBuilder.from(message.embeds[0])
			.setTitle(res > 0.5 ? "Heads" : res < 0.5 ? "Tails" : "Edge?!")
			.setThumbnail(
				`https://database.faithfulpack.net/images/bot/${
					res > 0.5 ? "coin_heads" : res < 0.5 ? "coin_tails" : "coin_edge"
				}.png?w=240&enlarge=1`,
			);

		await message.edit({ embeds: [embed] });
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(interaction.strings().command.coin.reflip.title)
					.setDescription(interaction.strings().command.coin.reflip.description),
			],
			flags: MessageFlags.Ephemeral,
		});
	},
});
