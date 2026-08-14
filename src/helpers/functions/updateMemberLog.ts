import { Client, type FaithfulGuild } from "@client";
import { ChannelType } from "discord.js";

/**
 * Update a member log
 * @author Evorp
 * @param client Discord client
 * @param server Server to update
 * @returns
 */
export default async function updateMemberLog(client: Client, server: FaithfulGuild) {
	// server doesn't have channel for member logging
	if (!server.member_log) return;

	const guild = await client.guilds.fetch({ guild: server.id, force: true });
	const channel = client.channels.cache.get(server.member_log);

	if (!guild || !channel) return;
	const count = guild.memberCount || guild.approximateMemberCount;

	// you can add different patterns depending on the channel type
	switch (channel.type) {
		case ChannelType.GuildText:
			channel.setName(`members-${count}`);
			break;
		case ChannelType.GuildVoice:
			channel.setName(`Members: ${count}`);
			break;
	}

	return count;
}
