import type { SlashCommand } from "@interfaces/interactions";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import faqStrings from "@json/faq.json";
import axios from "axios";
import embedSeries from "@functions/embedSeries";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("faq")
		.setDescription("Show a specific FAQ entry.")
		.addStringOption((option) =>
			option.setName("keyword").setDescription("The specific FAQ entry to view.").setRequired(true),
		),
	async execute(interaction) {
		const choice = interaction.options.getString("keyword", true).toLocaleLowerCase().trim();

		if (choice == "all") {
			if (!interaction.hasPermission("manager")) return;

			await interaction.complete();
			return embedSeries(
				interaction,
				faqStrings.map((faq) =>
					new EmbedBuilder()
						.setTitle(faq.question)
						.setDescription(faq.answer)
						.setColor(colors.brand)
						.setFooter({ text: `Keywords: ${faq.keywords.join(" • ")}` }),
				),
			);
		}

		const faqChoice = faqStrings.find((faq) => faq.keywords.includes(choice));

		if (!faqChoice)
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.invalid_choice.title)
						.setDescription(
							interaction.strings().error.invalid_choice.description.replace("%CHOICE%", choice),
						)
						.setColor(colors.red),
				],
				flags: MessageFlags.Ephemeral,
			});

		const question = (
			await axios.get<string>(`${interaction.client.tokens.apiUrl}settings/images.question`)
		).data;

		const faqEmbed = new EmbedBuilder()
			.setTitle(faqChoice.question)
			.setDescription(faqChoice.answer)
			.setThumbnail(question)
			.setFooter({ text: `Keywords: ${faqChoice.keywords.join(" • ")}` });

		interaction.reply({ embeds: [faqEmbed], components: addDeleteButton() });
	},
};
