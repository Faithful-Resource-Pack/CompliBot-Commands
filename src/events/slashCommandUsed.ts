import { defineEvent } from "@interfaces/events";
import { ChatInputCommandInteraction, EmbedBuilder } from "@client";
import { handleError } from "@functions/handleError";
import { colors } from "@utility/colors";
import { info } from "@helpers/logger";
import addDeleteButton from "@utility/addDeleteButton";

export default defineEvent({
	name: "slashCommandUsed",
	async execute(client, interaction: ChatInputCommandInteraction) {
		client.storeAction("slashCommand", interaction);

		const command = client.commands.get(interaction.commandName);
		// command doesn't exist
		if (!command) return;

		// increment command usage
		const count = client.commandsProcessed.get(interaction.commandName) || 0;
		client.commandsProcessed.set(interaction.commandName, count + 1);
		client.commandsProcessed.save();

		if (client.verbose) console.log(`${info}Slash command used: /${interaction.commandName}`);

		// ! await required for try catch support
		try {
			if (typeof command.execute === "function") return await command.execute(interaction);
			const subcommandName = interaction.options.getSubcommand();
			const subcommand = command.execute[subcommandName];
			return await subcommand?.(interaction);
		} catch (err: unknown) {
			handleError(client, err, "Slash Command Error");

			const options = {
				embeds: [
					new EmbedBuilder()
						.setTitle(interaction.strings(true).error.generic)
						.setDescription(
							`${interaction.strings(true).error.command}\nError for the developers:\n\`\`\`${err}\`\`\``,
						)
						.setColor(colors.red),
				],
				components: addDeleteButton(),
			};

			return interaction.deferred ? interaction.followUp(options) : interaction.reply(options);
		}
	},
});
