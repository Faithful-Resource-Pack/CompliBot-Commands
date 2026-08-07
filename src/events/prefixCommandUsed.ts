import { defineEvent } from "@interfaces/events";

import getImage, { imageNotFound } from "@images/getImage";
import { imageTooBig } from "@helpers/warnUser";

import { magnifyToAttachment } from "@images/magnify";
import { tileToAttachment } from "@images/tile";
import { paletteToAttachment } from "@images/palette";
import { magnifyButtons, tileButtons } from "@utility/buttons";

import { info } from "@helpers/logger";
import addDeleteButton from "@utility/addDeleteButton";

export default defineEvent({
	name: "prefixCommandUsed",
	async execute(client, message) {
		const args = message.content.split(" ");

		const command = args.shift()?.slice(client.tokens.prefix.length);
		// no command, just a slash
		if (!command) return;

		// when adding a new prefix command remember to register it here
		const prefixCommands = ["m", "z", "t", "p"];

		if (!prefixCommands.includes(command)) return; // just generally using a slash
		if (client.verbose)
			console.log(`${info}Prefix command used: ${client.tokens.prefix}${command}`);

		let stat: string;
		try {
			const url = await getImage(message);
			if (!url) return imageNotFound(message);

			// super basic prefix command handler for common utilities
			switch (command) {
				case "m":
				case "z": {
					await message.reply({
						files: [await magnifyToAttachment(url)],
						components: addDeleteButton([magnifyButtons]),
					});
					stat = "magnify";
					break;
				}
				case "t": {
					const file = await tileToAttachment(url, { magnify: true });
					if (!file) return imageTooBig(message);
					await message.reply({ files: [file], components: addDeleteButton([tileButtons]) });
					stat = "tile";
					break;
				}
				case "p": {
					const [attachment, embed] = await paletteToAttachment(url);
					if (!attachment || !embed) return imageTooBig(message);
					await message.reply({
						files: [attachment],
						embeds: [embed],
						components: addDeleteButton(),
					});
					stat = "palette";
					break;
				}
			}
		} finally {
			// only commit once everything is done (this is synchronous and can slow things down)
			if (stat) {
				const count = client.commandStats.get(stat) || 0;
				client.commandStats.set(stat, count + 1);
				client.commandStats.save();
			}
		}
	},
});
