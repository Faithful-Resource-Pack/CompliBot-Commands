import { defineCommand } from "@interfaces/interactions";
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import { Client, EmbedBuilder } from "@client";
import { inspect } from "util";

export default defineCommand({
	servers: ["dev"],
	data: new SlashCommandBuilder()
		.setName("eval")
		.setDescription("Evaluates a string of code.")
		.addStringOption((option) =>
			option.setName("code").setDescription("The code to evaluate.").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.hasPermission("dev")) return;
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const clean = async (text: unknown, client: Client): Promise<string> => {
			if (text && text.constructor.name === "Promise") text = await text;
			if (typeof text !== "string") text = inspect(text, { depth: 1 });

			// we now know that text is a string
			return (text as string)
				.replaceAll(client.tokens.token, "[BOT_TOKEN]")
				.replaceAll(client.tokens.apiToken, "[API_TOKEN]")
				.replaceAll(client.tokens.gitToken, "[GIT_TOKEN]")
				.replace(/`/g, "`" + String.fromCharCode(8203))
				.replace(/@/g, "@" + String.fromCharCode(8203));
		};

		/* eslint-disable @typescript-eslint/no-unused-vars */
		const { client, channel, guild } = interaction;
		/* eslint-enable @typescript-eslint/no-unused-vars */

		const code = interaction.options.getString("code", true);
		let evaluated: any;
		try {
			evaluated = await eval(
				`(async () => { try { return await (async () => {${
					code.includes("return") ? code : `return ${code}`
				}})() } catch (e) { return e } })()`,
			);
		} catch (e) {
			evaluated = e;
		}

		interaction.editReply({
			embeds: [
				new EmbedBuilder().setDescription(
					`\`\`\`js\n${(await clean(evaluated, interaction.client)).slice(0, 4085)}\`\`\``,
				),
			],
		});
	},
});
