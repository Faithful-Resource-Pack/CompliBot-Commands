import commands from "@lang/en-US/commands.json";
import errors from "@lang/en-US/errors.json";
import { mergeDeep } from "@utility/methods";
import { AnyInteraction } from "@interfaces/interactions";

export const JSONFiles = ["commands", "errors"];
export const baseTranslations = { ...commands, ...errors };
export type AllStrings = typeof baseTranslations;

/**
 * Load strings based on interaction language
 * @author Evorp
 * @param forceEnglish whether to only use english or determine language
 * @returns all strings in the correct language
 */
export function strings(this: AnyInteraction, forceEnglish = false): AllStrings {
	if (forceEnglish || ["en-GB", "en-US"].includes(this.locale)) return baseTranslations;

	// not in english
	return JSONFiles.reduce((acc, json) => {
		let out: AllStrings;
		try {
			// prevent errors if language isn't done
			out = mergeDeep({}, acc, require(`@lang/${this.locale}/${json}.json`));
		} catch {
			out = acc;
		}
		return out;
	}, baseTranslations);
}
