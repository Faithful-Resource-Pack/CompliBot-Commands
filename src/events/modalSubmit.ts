import { defineEvent } from "@interfaces/events";

export default defineEvent({
	name: "modalSubmit",
	async execute(client, interaction) {
		client.appendLog("modalSubmit", interaction);

		const modal = client.modals.get(interaction.customId);
		if (modal) return modal.execute(client, interaction);
	},
});
