import {
	SlashCommandSubcommandsOnlyBuilder,
	CacheType,
	SlashCommandOptionsOnlyBuilder,
	AutocompleteInteraction,
} from "discord.js";
import {
	Client,
	ChatInputCommandInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from "@client";

export type AnyInteraction<Cached extends CacheType = CacheType> =
	| ChatInputCommandInteraction<Cached>
	| ButtonInteraction<Cached>
	| ModalSubmitInteraction<Cached>
	| StringSelectMenuInteraction<Cached>;

export type SyncSlashCommandBuilder =
	SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;

/** Used for generating dynamic properties (e.g. /missing version list) */
export type AsyncSlashCommandBuilder = (client: Client) => Promise<SyncSlashCommandBuilder>;

export type SlashCommandExecute = (interaction: ChatInputCommandInteraction) => void;

export interface SlashCommand {
	readonly servers?: string[];
	readonly data: SyncSlashCommandBuilder | AsyncSlashCommandBuilder;
	readonly execute: Record<string, SlashCommandExecute> | SlashCommandExecute;
	readonly autocomplete?: (interaction: AutocompleteInteraction) => Promise<any>;
}

export const defineCommand = (data: SlashCommand) => data;

// couldn't think of a better place to put this :P
export type BotBans = { ids: string[] };
