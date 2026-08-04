import { defineComponent } from "@interfaces/components";
import { info } from "@helpers/logger";
import { EmbedBuilder, ModalSubmitInteraction } from "@client";
import sendFeedback from "@functions/feedback";

export default defineComponent<ModalSubmitInteraction>({
	id: "bugTicket",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Bug report submitted!`);
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Bug report received!")
					.setDescription(
						"Your ticket will be created shortly on GitHub. Thank you for helping us improve the bot!",
					),
			],
		});

		// I know there's a lot of copy/paste but this is the best djs can do
		const title = `[Bug] ${interaction.fields.getTextInputValue("bugTitle")}`;
		const whatHappened = interaction.fields.getTextInputValue("bugWhatHappened");
		const toReproduce = interaction.fields.getTextInputValue("bugToReproduce");
		const notes = interaction.fields.getTextInputValue("bugNotes");

		const description =
			`### What happened?\n\n${whatHappened}\n\n` +
			`### To reproduce\n\n${toReproduce}\n\n` +
			`### Notes\n\n${notes || "*No response*"}`;

		return sendFeedback(interaction, title, description);
	},
});
