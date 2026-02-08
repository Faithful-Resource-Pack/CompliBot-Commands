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
	StringSelectMenuInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
} from "@client";
import type { Tokens } from "@interfaces/tokens";
import type { Component } from "@interfaces/components";
import type { AnyInteraction, SlashCommand } from "@interfaces/interactions";
import type { Event } from "@interfaces/events";
import { EmittingCollection } from "@helpers/emittingCollection";
import { setData, getData } from "@utility/handleJSON";
import { handleError } from "@functions/handleError";
import { err, info, success } from "@helpers/logger";

import { join } from "path";
import chalk from "chalk";
import startClient from "@index";
import walkSync from "@helpers/walkSync";
import axios from "axios";

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

export type LogAction =
	| "message"
	| "slashCommand"
	| "button"
	| "selectMenu"
	| "modalSubmit"
	| "guildMemberUpdate"
	| "guildJoined";

export type LogData = Message | Guild | AnyInteraction;

export type Log = {
	type: LogAction;
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
	public verbose = false;
	public firstStart = true; // used for prettier restarting in dev mode
	public readonly tokens: Tokens;

	public readonly logs: Log[] = [];
	private readonly maxLogs = 50;

	public readonly menus = new Collection<string, Component<StringSelectMenuInteraction>>();
	public readonly buttons = new Collection<string, Component<ButtonInteraction>>();
	public readonly modals = new Collection<string, Component<ModalSubmitInteraction>>();
	public readonly commands = new Collection<string, SlashCommand>();

	public commandsProcessed = new EmittingCollection<string, number>();
	public versions: string[] = [];

	constructor(data: ClientOptions & { tokens: Tokens }, firstStart = true) {
		super(data);
		this.verbose = data.tokens.verbose;
		this.tokens = data.tokens;
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
				this.loadCollections();
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
	 * Convenience method to load all emitting collections at once
	 * @author Juknum
	 */
	private loadCollections() {
		if (this.verbose) console.log(`${info}Loading collection data...`);
		this.loadCollection(this.commandsProcessed, paths.commandsProcessed, paths.json);
		return this;
	}

	/**
	 * Read and load data from a JSON file into emitting collection with events
	 * @author Nick, Juknum
	 * @param collection collection to load into
	 * @param filename file to load data from
	 * @param relativePath path to load data from
	 */
	private loadCollection<V>(
		collection: EmittingCollection<string, V>,
		filename: string,
		relativePath: string,
	) {
		const obj: Record<string, V> = getData({ filename, relativePath });
		Object.entries(obj).forEach(([k, v]) => collection.set(k, v));

		collection.events.on("dataSet", () =>
			this.saveEmittingCollection(collection, filename, relativePath),
		);

		collection.events.on("dataDeleted", () =>
			this.saveEmittingCollection(collection, filename, relativePath),
		);
	}

	/**
	 * Save an emitting collection into a JSON file
	 * @author Nick, Juknum
	 * @param collection collection to save
	 * @param filename where to save it
	 * @param relativePath folder to save it
	 */
	private saveEmittingCollection<V>(
		collection: EmittingCollection<string, V>,
		filename: string,
		relativePath: string,
	) {
		const data = Object.fromEntries(collection);
		setData({ filename, relativePath, data: JSON.parse(JSON.stringify(data)) });
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
		const commandsArr: {
			servers?: string[];
			command: RESTPostAPIApplicationCommandsJSONBody;
		}[] = [];

		// optimization
		await Promise.all(
			walkSync(paths.commands)
				.filter((file) => file.endsWith(".ts"))
				.map(async (file) => {
					const command: SlashCommand = await import(file).then(({ command }) => command);
					const data =
						command.data instanceof Function
							? await command.data(this) // for dynamic data (e.g. /missing)
							: command.data;
					this.commands.set(data.name, command);
					commandsArr.push({
						servers: command.servers,
						command: data.toJSON(),
					});
				}),
		);

		const rest = new REST({ version: "10" }).setToken(this.tokens.token);
		const allGuilds = (
			await axios.get<Record<string, FaithfulGuild>>(`${this.tokens.apiUrl}settings/discord.guilds`)
		).data;

		// lock all commands to dev server
		if (this.tokens.dev)
			commandsArr.forEach((el) => {
				el.servers = ["dev"];
			});

		const guilds = commandsArr.reduce<Record<string, RESTPostAPIApplicationCommandsJSONBody[]>>(
			(acc, cmd) => {
				if (!cmd.servers) cmd.servers = ["global"];
				for (const server of cmd.servers) {
					acc[server] ||= [];
					acc[server].push(cmd.command);
				}
				return acc;
			},
			{ global: [] },
		);

		await Promise.all(
			Object.entries(allGuilds)
				// if the client isn't in the guild, skip it
				.filter(([, { id }]) => this.guilds.cache.get(id))
				.map(([name, { id }]) => {
					// add guild-specific commands (e.g. /eval)
					rest
						.put(Routes.applicationGuildCommands(this.user.id, id), {
							body: guilds[name],
						})
						.then(() =>
							console.log(`${success}Successfully added slash commands to server: ${name}`),
						);
				}),
		);

		// we add global commands to all guilds (only if not in dev mode)
		if (!this.tokens.dev) {
			await rest.put(Routes.applicationCommands(this.user.id), { body: guilds.global });
			console.log(`${success}Successfully added global slash commands`);
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
	public storeAction(type: LogAction, data: LogData) {
		// remove from start (oldest messages) on overflow
		if (this.logs.length >= this.maxLogs) this.logs.shift();
		this.logs.push({ type, data });
	}
}
