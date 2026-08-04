import {
	ActivityType,
	Client,
	ClientOptions,
	Collection,
	Guild,
	RESTPostAPIApplicationCommandsJSONBody,
	Routes,
	REST,
} from "discord.js";
import {
	Message,
	ButtonInteraction,
	StringSelectMenuInteraction,
	ModalSubmitInteraction,
} from "@client";

import axios from "axios";
import chalk from "chalk";

import type { Tokens } from "@interfaces/tokens";
import type { AnyInteraction, SlashCommand } from "@interfaces/interactions";
import type { Component } from "@interfaces/components";
import type { Event } from "@interfaces/events";

import SavableCollection from "@helpers/savableCollection";
import { handleError } from "@functions/handleError";
import { err, info, success } from "@helpers/logger";
import walkSync from "@helpers/walkSync";
import { join } from "path";

import startClient from "@index";

// not in a config file because dynamic data
export const paths = {
	json: join(process.cwd(), "json", "dynamic"), // json folder at root
	commands: join(__dirname, "..", "commands"),
	events: join(__dirname, "..", "events"),
	components: {
		buttons: join(__dirname, "..", "components", "buttons"),
		menus: join(__dirname, "..", "components", "menus"),
		modals: join(__dirname, "..", "components", "modals"),
	},
	commandsProcessed: "commandsProcessed.json",
} as const;

export const errors = [
	{ displayName: "Disconnect", error: "disconnect" },
	{ displayName: "Unhandled Rejection", error: "unhandledRejection" },
	{ displayName: "Uncaught Exception", error: "uncaughtException" },
];

export type LogType =
	| "message"
	| "slashCommand"
	| "button"
	| "selectMenu"
	| "modalSubmit"
	| "guildMemberUpdate"
	| "guildJoined";

export type LogData = Message | Guild | AnyInteraction;

export type ActionLog = {
	type: LogType;
	data: any; // technically LogData but TS union type validation is painful
};

export interface FaithfulGuild {
	id: string;
	invite?: string;
	member_log?: string;
}

/**
 * Extend client class to add message component collections, tokens, and slash commands directly
 * @author Nick, Evorp, Juknum
 * @template Ready so interfaces don't complain about overriding classes incorrectly
 */
export class ExtendedClient<Ready extends boolean = boolean> extends Client<Ready> {
	public firstStart = true; // used for prettier restarting in dev mode
	public readonly tokens: Tokens;
	public readonly verbose: boolean;

	public readonly logs: ActionLog[] = [];
	private readonly maxLogs = 50;

	public readonly menus = new Collection<string, Component<StringSelectMenuInteraction>>();
	public readonly buttons = new Collection<string, Component<ButtonInteraction>>();
	public readonly modals = new Collection<string, Component<ModalSubmitInteraction>>();
	public readonly commands = new Collection<string, SlashCommand>();

	public readonly commandsProcessed = new SavableCollection<number>(
		join(paths.json, paths.commandsProcessed),
	);
	public versions: string[] = [];

	constructor(data: ClientOptions & { tokens: Tokens }, firstStart = true) {
		super(data);
		this.tokens = data.tokens;

		// handy shorthand
		this.verbose = data.tokens.verbose;
		this.firstStart = firstStart;
	}

	public init(interaction?: AnyInteraction) {
		// pretty stuff so it doesn't print the logo upon restart
		if (!this.firstStart) {
			console.log(`${success}Restarted`);
			if (interaction) interaction.editReply({ content: "Reboot succeeded!" });
		} else this.asciiArt();

		// login client
		this.login(this.tokens.token)
			.catch((e) => {
				// Allows for showing different errors like missing privileged gateway intents, this caused me so much pain >:(
				console.log(`${err}${e}`);
				process.exit(1);
			})
			.then(() => {
				this.loadSlashCommands();

				this.loadEvents();
				this.loadComponents();
				this.loadVersions();
			});

		// all error types
		errors.forEach(({ error, displayName }) =>
			process.on(error, (reason) => {
				if (reason) handleError(this, reason, displayName);
			}),
		);

		// uptime kuma heartbeat for production bot
		if (this.tokens.status) {
			setInterval(() => fetch(this.tokens.status + this.ws.ping).catch(() => {}), 600000); // 10 minutes
		}

		return this;
	}

	public async restart(interaction?: AnyInteraction) {
		console.log(`${info}Restarting bot...`);
		this.destroy();
		startClient(false, interaction);
		return this;
	}

	// prettier-ignore
	private asciiArt() {
		const darkColor = chalk.hex(this.tokens.maintenance === false ? "#0026ff" : "#ff8400");
		const lightColor = chalk.hex(this.tokens.maintenance === false ? "#0066ff" : "#ffc400");

		console.log("\n\n")
		console.log(darkColor` .d8888b.                                  888 d8b ` + lightColor`888888b.            888`);
		console.log(darkColor`d88P  Y88b                                 888 Y8P ` + lightColor`888  "88b           888`);
		console.log(darkColor`888    888                                 888     ` + lightColor`888  .88P           888`);
		console.log(darkColor`888         .d88b.  88888b.d88b.  88888b.  888 888 ` + lightColor`8888888K.   .d88b.  888888`);
		console.log(darkColor`888        d88""88b 888 "888 "88b 888 "88b 888 888 ` + lightColor`888  "Y88b d88""88b 888`);
		console.log(darkColor`888    888 888  888 888  888  888 888  888 888 888 ` + lightColor`888    888 888  888 888`);
		console.log(darkColor`Y88b  d88P Y88..88P 888  888  888 888 d88P 888 888 ` + lightColor`888   d88P Y88..88P Y88b.`);
		console.log(darkColor` "Y8888P"   "Y88P"  888  888  888 88888P"  888 888 ` + lightColor`8888888P"   "Y88P"   "Y888`);
		console.log(darkColor`                                  888`);
		console.log(darkColor`                                  888              ` + chalk.white.bold(`           ${new Date().toDateString()}`));
		console.log(darkColor`                                  888              ` + chalk.gray.italic(this.tokens.maintenance === false ? " ~ Made lovingly with pain\n" : "    Maintenance mode!\n"));
	}

	/**
	 * Remove slash commands
	 * @author Nick
	 */
	public async deleteGlobalSlashCommands() {
		console.log(`${success}deleting slash commands`);

		const rest = new REST({ version: "10" }).setToken(this.tokens.token);
		const commands = (await rest.get(Routes.applicationCommands(this.user.id))) as any[];
		await Promise.all(
			commands.map((command) =>
				rest.delete(`${Routes.applicationCommands(this.user.id)}/${command.id}`),
			),
		);
		console.log(`${success}Delete complete`);
	}

	/**
	 * Load slash commands
	 * @author Nick, Juknum
	 */
	public async loadSlashCommands() {
		const commandPaths = walkSync(paths.commands).filter((file) => file.endsWith(".ts"));

		// run import/data loading concurrently since they don't block
		const commands = await Promise.all(
			commandPaths.map(async (file) => {
				const command: SlashCommand = await import(file).then(({ default: cmd }) => cmd);

				// handle dynamic data (e.g. /missing)
				const data = typeof command.data === "function" ? await command.data(this) : command.data;
				this.commands.set(data.name, command);

				return {
					// lock all commands to dev server
					servers: this.tokens.dev ? ["dev"] : command.servers,
					command: data.toJSON(),
				};
			}),
		);

		const rest = new REST({ version: "10" }).setToken(this.tokens.token);
		const allGuilds = (
			await axios.get<Record<string, FaithfulGuild>>(`${this.tokens.apiUrl}settings/discord.guilds`)
		).data;

		const groupedCommands = commands.reduce(
			(acc, { servers = ["global"], command }) => {
				for (const server of servers) {
					acc[server] ||= [];
					acc[server].push(command);
				}
				return acc;
			},
			{ global: [] } as Record<string, RESTPostAPIApplicationCommandsJSONBody[]>,
		);

		await Promise.all(
			Object.entries(allGuilds).map(async ([name, server]) => {
				// skip servers the bot isn't in
				if (!this.guilds.cache.get(server.id)) return;

				// for commands like /eval, or all commands in dev mode
				await rest.put(Routes.applicationGuildCommands(this.user.id, server.id), {
					body: groupedCommands[name],
				});
				console.log(`${success}Added guild-specific slash commands to: ${name}`);
			}),
		);

		// we add global commands to all guilds (only if not in dev mode)
		if (!this.tokens.dev) {
			await rest.put(Routes.applicationCommands(this.user.id), { body: groupedCommands.global });
			console.log(`${success}Added global slash commands`);
		}
	}

	/**
	 * Load client events
	 * @author Nick
	 */
	private loadEvents() {
		if (this.tokens.maintenance)
			return this.on("clientReady", () => {
				this.user.setPresence({
					activities: [{ name: "under maintenance", type: ActivityType.Playing }],
					status: "idle",
				});
			});

		if (this.verbose) console.log(`${info}Loading event handlers...`);
		const events = walkSync(paths.events).filter((file) => file.endsWith(".ts"));
		for (const file of events) {
			const event: Event = require(file).default;
			// bind is just for adding ExtendedClient as the first argument always
			this.on(event.name as string, event.execute.bind(null, this));
		}
	}

	/**
	 * Convenience method to load all components at once
	 * @author Evorp
	 */
	private loadComponents() {
		if (this.verbose) console.log(`${info}Loading Discord components...`);
		for (const [key, path] of Object.entries(paths.components))
			this[key] = this.loadComponent(this[key], path);
	}

	/**
	 * Read given directory and add them to needed collection
	 * @author Evorp
	 * @param collection collection to load into
	 * @param path filepath to read and load component data from
	 */
	private loadComponent(collection: Collection<string, Component>, path: string) {
		const components = walkSync(path).filter((file) => file.endsWith(".ts"));
		for (const file of components) {
			const component: Component = require(file).default;
			collection.set(component.id, component);
		}
		return collection;
	}

	/**
	 * Load all Minecraft versions into the {@link versions} object
	 * @author Evorp
	 */
	private async loadVersions() {
		// horrible workaround for autocomplete (loading this every time takes too long)
		this.versions = await axios
			.get<string[]>(`${this.tokens.apiUrl}versions/list`)
			.then((res) => res.data);
	}

	/**
	 * Store any kind of action the bot does
	 * @author Juknum
	 * @param type
	 * @param data
	 */
	public storeAction(type: LogType, data: LogData) {
		// remove from start (oldest messages) on overflow
		if (this.logs.length >= this.maxLogs) this.logs.shift();
		this.logs.push({ type, data });
	}
}
