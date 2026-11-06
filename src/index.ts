import { Client } from "@client";
import { GatewayIntentBits, Partials } from "discord.js";
import type { AnyInteraction } from "@interfaces/interactions";

import tokens from "@json/tokens.json";

export default function startClient(firstStart = true, interaction?: AnyInteraction) {
	const client = new Client(
		{
			tokens,
			// remove this line to die instantly ~sharkaccino, 2021
			allowedMentions: { parse: ["users", "roles"], repliedUser: false },
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
				Partials.User,
			],
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.DirectMessageReactions,
				GatewayIntentBits.DirectMessageTyping,
				// GatewayIntentBits.MessageContent,
				// GatewayIntentBits.GuildPresences,
				// GatewayIntentBits.GuildMembers,
			],
		},
		firstStart,
	);
	return client.init(interaction);
}

// don't start if importing from elsewhere (same as python's __name___ == "__main__")
if (require.main === module) startClient();
