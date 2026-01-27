import type { SlashCommand } from "@interfaces/interactions";
import addDeleteButton from "@utility/addDeleteButton";
import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";

interface OrderOptions {
	[order: string]: {
		url: string;
		caption?: string;
	};
}

const options: OrderOptions = {
	pizza: {
		url: "https://i0.wp.com/metro.co.uk/wp-content/uploads/2016/02/pizza-cheese.gif",
		caption: "Buon Appetito!",
	},
	soup: {
		url: "https://c.tenor.com/45SSoTETymIAAAAS/sopita-de-fideo-noodle.gif",
		caption: "Guten Appetit",
	},
	burger: { url: "https://c.tenor.com/tdFqDJemKpUAAAAC/mcdonalds-big-mac.gif" },
	poop: {
		url: "https://media.tenor.com/QA6mPKs100UAAAAC/caught-in.gif",
		caption: ":eyes:",
	},
	66: {
		url: "https://media1.tenor.com/images/fb7250a2ef993a37e9c7f48af760821c/tenor.gif",
	},
	help: { url: "https://c.tenor.com/yi5btxWVAwwAAAAS/help-shouting.gif" },
	ice: { url: "https://c.tenor.com/ySPd8qwdV7QAAAAC/frozen-ice.gif" },
	fire: { url: "https://i.giphy.com/media/Qre4feuyNhiYIzD7hC/200.gif" },
	popcorn: { url: "https://c.tenor.com/yinQBUPPd_IAAAAC/michael-jackson-popcorn.gif" },
};

export const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("order")
		.setDescription("Get something special")
		.addStringOption((option) =>
			option
				.setName("item")
				.setDescription("The item you want.")
				.addChoices(
					...Object.keys(options).map((option) => ({
						name: option,
						value: option,
					})),
				)
				.setRequired(true),
		),
	async execute(interaction) {
		const choice = options[interaction.options.getString("item", true)];
		interaction.reply({
			content: choice.caption,
			files: [
				new AttachmentBuilder(choice.url, {
					name: choice.url,
				}),
			],
			components: addDeleteButton(),
		});
	},
};
