import { defineEvent } from "@interfaces/events";

export default defineEvent({
	name: "threadCreate",
	async execute(_client, thread) {
		if (thread.joinable) await thread.join().catch(console.error);
	},
});
