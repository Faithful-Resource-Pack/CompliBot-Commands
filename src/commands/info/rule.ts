import type { SlashCommand } from "@interfaces/interactions";
import { SlashCommandBuilder } from "discord.js";
import { EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import ruleStrings from "@json/rules.json";
import axios from "axios";
import embedSeries from "@functions/embedSeries";
import addDeleteButton from "@utility/addDeleteButton";

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("rule")
		.setDescription("Show the Faithful server rules.")
		.addStringOption((option) =>
			option
				.setName("number")
				.setDescription("Which rule to view")
				.addChoices(
					// using the value as an array index
					{ name: "1", value: "0" },
					{ name: "2", value: "1" },
					{ name: "3", value: "2" },
					{ name: "4", value: "3" },
					{ name: "5", value: "4" },
					{ name: "6", value: "5" },
					{ name: "7", value: "6" },
					{ name: "8", value: "7" },
					{ name: "9", value: "8" },
					{ name: "10", value: "9" },
					{ name: "all", value: "all" },
					{ name: "server", value: "server" },
				)
				.setRequired(true),
		),
	async execute(interaction) {
		const baseUrl = "https://docs.faithfulpack.net/pages/manuals/expanded-server-rules";
		const choice = interaction.options.getString("number", true);

		const { discord, images } = (await axios.get(`${interaction.client.tokens.apiUrl}settings/raw`))
			.data;

		if (["all", "server"].includes(choice)) {
			if (!interaction.hasPermission("manager")) return;

			await interaction.complete();

			const thumbnail: string =
				interaction.guildId == discord.guilds.classic_faithful.id ? images.cf_main : images.main;

			if (choice == "all")
				await interaction.channel.send({
					embeds: [
						new EmbedBuilder()
							.setTitle(ruleStrings.rules_info.heading.title)
							.setDescription(ruleStrings.rules_info.heading.description)
							.setColor(colors.brand)
							.setThumbnail(thumbnail)
							.setURL(baseUrl),
					],
				});

			await embedSeries(
				interaction,
				ruleStrings[choice == "all" ? "rules" : "server"].map((rule) =>
					new EmbedBuilder()
						.setTitle(rule.title)
						.setDescription(rule.description)
						.setColor(colors.brand),
				),
			);

			if (choice !== "all") return;

			// the extra stuff at the bottom (expanded rules + changelog)
			const infoEmbeds = [
				new EmbedBuilder()
					.setColor(colors.brand)
					.setTitle(ruleStrings.rules_info.expanded_rules.title)
					.setDescription(ruleStrings.rules_info.expanded_rules.description),
			];

			if (ruleStrings.rules_info.changes.enabled) {
				infoEmbeds.push(
					new EmbedBuilder()
						.setTitle(ruleStrings.rules_info.changes.title)
						.setColor(colors.brand)
						.setDescription(ruleStrings.rules_info.changes.description)
						.setFooter({
							text: ruleStrings.rules_info.changes.footer,
							iconURL: thumbnail,
						}),
				);
			}

			return interaction.channel.send({ embeds: infoEmbeds });
		}

		const ruleChoice: (typeof ruleStrings.rules)[number] = ruleStrings.rules[Number(choice)];
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(ruleChoice.title)
					.setDescription(ruleChoice.description)
					.setThumbnail(images.rules)
					.setURL(`${baseUrl}#${Number(choice) + 1}`),
			],
			components: addDeleteButton(),
		});
	},
};
