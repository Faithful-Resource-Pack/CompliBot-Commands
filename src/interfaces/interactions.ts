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

export type SyncOrAsyncType<T> = T | ((client: Client) => Promise<T>);

export interface BaseSlashCommand {
	readonly servers?: string[];
	readonly autocomplete?: <T>(interaction: AutocompleteInteraction) => Promise<T>;
}

// use two different interfaces so the types within them always agree (no function execute when subcommands)
export interface SlashCommand extends BaseSlashCommand {
	readonly data: SyncOrAsyncType<SlashCommandOptionsOnlyBuilder>;
	readonly execute: SlashCommandExecute;
}
export interface SlashSubcommand extends BaseSlashCommand {
	readonly data: SyncOrAsyncType<SlashCommandSubcommandsOnlyBuilder>;
	readonly execute: Record<string, SlashCommandExecute>;
}

export type SlashCommandExecute = (interaction: ChatInputCommandInteraction) => void;

export const defineCommand = <IsSubCommand extends boolean>(
	data: IsSubCommand extends true ? SlashSubcommand : SlashCommand,
) => data;
