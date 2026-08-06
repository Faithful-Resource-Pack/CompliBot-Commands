import { Client, Message } from "@client";
import {
	AutocompleteInteraction,
	ButtonInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	ModalSubmitInteraction,
	OmitPartialGroupDMChannel,
	StringSelectMenuInteraction,
} from "discord.js";

interface AllEvents extends ClientEvents {
	prefixCommandUsed: [message: OmitPartialGroupDMChannel<Message>];
	slashCommandUsed: [interaction: ChatInputCommandInteraction];
	buttonUsed: [interaction: ButtonInteraction];
	selectMenuUsed: [interaction: StringSelectMenuInteraction];
	modalSubmit: [interaction: ModalSubmitInteraction];
	autocomplete: [interaction: AutocompleteInteraction];
}

export interface Event<E extends keyof AllEvents> {
	readonly name: E;
	readonly execute: EventExecute<E>;
}

export type EventExecute<E extends keyof AllEvents> = (
	client: Client<true>,
	...args: AllEvents[E]
) => void;

export const defineEvent = <E extends keyof AllEvents>(data: Event<E>) => data;
