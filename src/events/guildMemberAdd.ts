import { defineEvent } from "@interfaces/events";
import memberLog from "@functions/memberLog";

export default defineEvent({
	name: "guildMemberAdd",
	async execute(client, member) {
		memberLog(client, member.guild.id);
	},
});
