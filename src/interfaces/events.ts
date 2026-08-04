import { Client } from "@client";
import { ClientEvents } from "discord.js";

interface AllEvents extends ClientEvents {
	slashCommandUsed: string;
	buttonUsed: string;
	selectMenuUsed: string;
	modalSubmit: string;
	autocomplete: string;
}

export interface Event {
	readonly name: keyof AllEvents;
	readonly execute: EventExecute;
}

export type EventExecute = (client: Client<true>, ...args: any[]) => void;

export const defineEvent = (data: Event) => data;
