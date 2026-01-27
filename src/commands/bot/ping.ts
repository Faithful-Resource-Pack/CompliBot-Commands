import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "@client";
import { ping } from "@json/quotes.json";
import { choice } from "@utility/methods";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot and API latency."),
	async execute(interaction) {
		const quote = choice(ping);

		// NEVER USE AWAIT ASYNC
		// only send response to maximize response time
		interaction.reply({ content: "** **", withResponse: true }).then(({ resource }) => {
			const apiPing = interaction.client.ws.ping;
			const botPing = resource.message.createdTimestamp - interaction.createdTimestamp;

			const embed = new EmbedBuilder()
				.setTitle("Pong!")
				.setDescription(`_${quote.replace("%YEAR%", String(new Date().getFullYear() + 2))}_`)
				.addFields(
					{ name: "Bot Latency", value: `${botPing}ms`, inline: true },
					{ name: "API Latency", value: `${Math.round(apiPing)}ms`, inline: true },
				);

			return interaction.editReply({ embeds: [embed], components: addDeleteButton() });
		});
	},
};
