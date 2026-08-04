import { defineEvent } from "@interfaces/events";
import { GuildMember } from "discord.js";
import memberLog from "@functions/memberLog";

export default defineEvent({
	name: "guildMemberRemove",
	async execute(client, member: GuildMember) {
		memberLog(client, member.guild.id);
	},
});
