import { Collection } from "discord.js";

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

/**
 * @author Juknum
 */
export default class SavableCollection<V> extends Collection<string, V> {
	private readonly path: string;

	constructor(path: string) {
		super();
		this.path = path;
		Object.entries<V>(getData(this.path)).forEach(([k, v]) => this.set(k, v));
	}

	/**
	 * Save the collection to the JSON file
	 */
	public save() {
		setData(this.path, JSON.stringify(Object.fromEntries(this)));
	}
}

/**
 * Read data from JSON
 * @author Juknum
 * @param options which file
 * @returns json file
 */
export function getData(path: string, fallback = "{}") {
	if (!existsSync(path)) setData(path, fallback);
	return JSON.parse(readFileSync(path).toString());
}

/**
 * Set data to a given JSON
 * @author Juknum
 * @param options data to set
 */
export function setData(path: string, data: string) {
	// create nested directories if needed then write data as-is
	if (!existsSync(path)) mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, data);
}
