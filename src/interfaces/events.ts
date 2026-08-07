import { Client } from "@client";
import { ClientEvents } from "discord.js";

declare module "discord.js" {
	interface ClientEvents {
		prefixCommandUsed: [message: OmitPartialGroupDMChannel<Message>];
		slashCommandUsed: [interaction: ChatInputCommandInteraction];
		buttonUsed: [interaction: ButtonInteraction];
		selectMenuUsed: [interaction: StringSelectMenuInteraction];
		modalSubmit: [interaction: ModalSubmitInteraction];
		autocomplete: [interaction: AutocompleteInteraction];
	}
}

export interface Event<E extends keyof ClientEvents> {
	readonly name: E;
	readonly execute: EventExecute<E>;
}

export type EventExecute<E extends keyof ClientEvents> = (
	client: Client<true>,
	...args: ClientEvents[E]
) => void;

export const defineEvent = <E extends keyof ClientEvents>(data: Event<E>) => data;
