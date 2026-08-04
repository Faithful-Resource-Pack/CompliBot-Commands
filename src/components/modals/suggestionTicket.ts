import { defineComponent } from "@interfaces/components";
import { info } from "@helpers/logger";
import { EmbedBuilder, ModalSubmitInteraction } from "@client";
import sendFeedback from "@functions/feedback";

export default defineComponent<ModalSubmitInteraction>({
	id: "suggestionTicket",
	async execute(client, interaction) {
		if (client.verbose) console.log(`${info}Suggestion submitted!`);
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Feature request received!")
					.setDescription(
						"Your ticket will be created shortly on GitHub. Thank you for helping us improve the bot!",
					),
			],
		});

		const title = `[Feature] ${interaction.fields.getTextInputValue("suggestionTitle")}`;
		const isProblem = interaction.fields.getTextInputValue("suggestionIsProblem");
		const describe = interaction.fields.getTextInputValue("suggestionDescription");
		const notes = interaction.fields.getTextInputValue("suggestionNotes");

		const description =
			`### Is your feature request related to a problem?\n\n${isProblem || "*No response*"}\n\n` +
			`### Describe the feature you'd like\n\n${describe}\n\n` +
			`### Notes\n\n${notes || "*No response*"}\n\n`;

		return sendFeedback(interaction, title, description);
	},
});
