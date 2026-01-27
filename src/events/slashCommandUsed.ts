import { Collection } from "discord.js";
import type { Event } from "@interfaces/events";
import { ChatInputCommandInteraction, EmbedBuilder } from "@client";
import { handleError } from "@functions/handleError";
import { colors } from "@utility/colors";
import addDeleteButton from "@utility/addDeleteButton";

export default {
	name: "slashCommandUsed",
	async execute(client, interaction: ChatInputCommandInteraction) {
		client.storeAction("slashCommand", interaction);

		const command = client.commands.get(interaction.commandName);
		// command doesn't exist
		if (!command) return;

		// increment command usage
		const count = (client.commandsProcessed.get(interaction.commandName) || 0) + 1;
		client.commandsProcessed.set(interaction.commandName, count);

		// ! await required for try catch support
		try {
			// try subcommand
			if (command.execute instanceof Collection) {
				const subcommandName = interaction.options.getSubcommand();
				const subcommand = command.execute.get(subcommandName);
				await subcommand?.(interaction);
			}
			// regular command
			else await command.execute(interaction);
		} catch (err) {
			handleError(client, err, "Slash Command Error");

			const options = {
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings().error.generic)
						.setDescription(
							`${interaction.strings().error.command}\nError for the developers:\n\`\`\`${err}\`\`\``,
						)
						.setColor(colors.red),
				],
				components: addDeleteButton(),
			};

			return interaction.deferred ? interaction.followUp(options) : interaction.reply(options);
		}
	},
} as Event;
