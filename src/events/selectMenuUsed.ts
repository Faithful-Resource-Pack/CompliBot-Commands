import { defineEvent } from "@interfaces/events";

export default defineEvent({
	name: "selectMenuUsed",
	async execute(client, interaction) {
		client.storeAction("selectMenu", interaction);

		const selectMenu = client.menus.get(interaction.customId.split("_")[0]);
		if (selectMenu) return selectMenu.execute(client, interaction);
	},
});
