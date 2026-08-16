import { dev } from "@json/tokens.json";
import { SpawnOptions, spawn } from "child_process";

/**
 * spawn a child process and execute shell command
 * borrowed from https://github.com/mout/mout/ build script
 * borrowed from Miller Medeiros on https://gist.github.com/millermedeiros/4724047
 * released under MIT License
 * version: 0.1.0 (2021/08/13)
 */

/**
 * Execute a single shell command where "cmd" is a string
 * @author Miller Medeiros
 * @param cmd what command to run
 * @param cb callback to run afterwards (grabs error too)
 * @param options extra command line options for child_process
 */
export function execSync(cmd: string, cb: (err: unknown) => void, options: SpawnOptions = {}) {
	// this would be way easier on a shell/bash script :P
	const parts = cmd.split(/\s+/g);

	// don't spam console logs in production with command outputs
	const opt: SpawnOptions = {
		// ordered as [stdin, stdout, stderr]
		stdio: dev ? "inherit" : ["ignore", "ignore", "inherit"],
		...options,
	};

	const p = spawn(parts[0], parts.slice(1), opt);
	p.on("exit", (code: number) => {
		let err = null;
		if (code) {
			err = new Error(`command "${cmd}" exited with wrong status code "${code}"`);
			err.code = code;
			err.cmd = cmd;
		}

		if (cb) cb(err);
	});
}

// execute multiple commands in series
// this could be replaced by any flow control lib
export function seriesSync(cmds: string[], cb: (err: unknown) => void, options: SpawnOptions = {}) {
	const execNext = () => {
		execSync(
			cmds.shift(),
			(err: unknown) => {
				if (err) cb(err);
				else if (cmds.length) execNext();
				else cb(null);
			},
			options,
		);
	};

	execNext();
}

export async function exec(cmd: string, options: SpawnOptions = {}) {
	return new Promise((res, rej) => {
		execSync(
			cmd,
			(err: unknown) => {
				if (err === null) res(err);
				else rej(err);
			},
			options,
		);
	});
}

export async function series(cmds: string[], options: SpawnOptions = {}) {
	return new Promise((res, rej) => {
		seriesSync(
			cmds,
			(err: unknown) => {
				if (err === null) res(err);
				else rej(err);
			},
			options,
		);
	});
}
