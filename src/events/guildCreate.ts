import { Guild } from "discord.js";
import { EmbedBuilder } from "@client";
import { defineEvent } from "@interfaces/events";
import { info } from "@helpers/logger";

export default defineEvent({
	name: "guildCreate",
	async execute(client, guild: Guild) {
		client.storeAction("guildJoined", guild);
		client.loadSlashCommands();

		const embed = new EmbedBuilder()
			.setTitle("Thanks for inviting me")
			.setDescription("To get started, try to type `/` to see all available slash commands!");

		guild.systemChannel?.send({ embeds: [embed] });
		console.log(`${info}I was added to a guild. Now I'm in ${client.guilds.cache.size} total!`);
	},
});
