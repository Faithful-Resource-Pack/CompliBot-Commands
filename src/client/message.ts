import { Message } from "discord.js";
import { ExtendedClient } from "./client";
import { strings, AllStrings } from "@helpers/strings";

declare module "discord.js" {
	interface Message {
		readonly client: ExtendedClient<true>; // so you don't have to cast it every time
		strings(forceEnglish?: boolean): AllStrings;
	}
}

Message.prototype.strings = strings;

export { Message };
