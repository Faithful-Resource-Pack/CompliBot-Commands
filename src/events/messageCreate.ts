import { defineEvent } from "@interfaces/events";
import { Message, EmbedBuilder } from "@client";
import type { Submission } from "@interfaces/database";
import axios from "axios";
import { randint } from "@utility/methods";
import prefixCommandHandler from "@helpers/prefixCommandHandler";
import addDeleteButton from "@utility/addDeleteButton";

export default defineEvent({
	name: "messageCreate",
	async execute(client, message: Message<true>) {
		// duplicate message for logger (ask @Juknum)
		client.storeAction("message", structuredClone(message));

		if (message.author.bot) return;

		let packs: Record<string, Submission>;
		try {
			packs = (
				await axios.get<Record<string, Submission>>(`${client.tokens.apiUrl}submissions/raw`)
			).data;
			// returns early if you're in a submission channel
			if (Object.values(packs).some((pack) => pack.channels.submit === message.channel.id)) return;
		} catch {
			// api error, ignore
		}

		if (message.content.startsWith(client.tokens.prefix)) return prefixCommandHandler(message);

		/**
		 * easter eggs
		 */
		switch (message.content.toLocaleLowerCase()) {
			case "engineer gaming":
				return message.react("👷").catch(() => {});
			case "f":
				return message.react("🇫").catch(() => {});
			case "fr":
				return message.react("🇫🇷").catch(() => {});
			case "band":
			case "banding":
				return Promise.all(
					["🎤", "🎸", "🥁", "🪘", "🎺", "🎷", "🎹", "🪗", "🎻"].map((emoji) =>
						message.react(emoji),
					),
				);
			case "monke":
				await message.react("🎷").catch(() => {});
				await message.react("🐒").catch(() => {});
				break;
			case "hello there":
				message.reply({
					content:
						randint(0, 4) === 1
							? "https://preview.redd.it/6n6zu25c66211.png?width=960&crop=smart&auto=webp&s=62024911a6d6dd85f83a2eb305df6082f118c8d1"
							: "https://c.tenor.com/L5n55GiSbx4AAAAd/tenor.gif",
					components: addDeleteButton(),
				});
				break;
		}

		if (message.content.includes("(╯°□°）╯︵ ┻━┻"))
			await message.reply({ content: "┬─┬ ノ( ゜-゜ノ) calm down bro" });

		if (message.mentions.has(client.user.id)) await message.react("1131383751713243277");

		if (/\bmhhh+/.test(message.content.toLocaleLowerCase())) {
			message.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription("```Uh-oh moment```")
						.setFooter({ text: "Swahili → English" }),
				],
				components: addDeleteButton(),
			});
		}

		if (/\bforgor\b/.test(message.content.toLocaleLowerCase())) await message.react("💀");
	},
});
