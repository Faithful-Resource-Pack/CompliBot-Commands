import { ThreadChannel } from "discord.js";
import { defineEvent } from "@interfaces/events";

export default defineEvent({
	name: "threadCreate",
	async execute(_client, thread: ThreadChannel) {
		if (thread.joinable) await thread.join().catch(console.error);
	},
});
