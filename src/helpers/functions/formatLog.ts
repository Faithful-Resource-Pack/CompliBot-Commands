import { ActionLog } from "@client";

/**
 * Format the log type into a human-readable format
 * @author Evorp, Juknum
 * @param log log to format
 * @returns formatted log type
 */
export function formatLogType(log: ActionLog) {
	switch (log.type) {
		case "slashCommand": {
			return `${log.type} [/${log.data.commandName}]`;
		}
		case "message": {
			let userType: string;
			if (log.data.author) userType = log.data.author.bot ? "BOT" : "USER";
			else userType = "Unknown (likely bot)";

			return `${log.type} | ${userType} | ${
				log.data.author ? log.data.author.username : "Unknown"
			}`;
		}
		default: {
			return log.type;
		}
	}
}

/**
 * Construct a URL to a given log
 * @author Evorp, Juknum
 * @param data log data
 * @returns Formatted URL
 */
export function formatLogURL(data: any) {
	if (data.url) return data.url;

	// interaction
	if (data.message) return data.message.url;

	// slash command constructed url
	if (data.guildId && data.channelId)
		return `https://discord.com/channels/${data.guildId}/${data.channelId}/${data.messageId || ""}`;

	if (data.guild) return `Guild ID is ${data.guild.id}`;

	return "Unknown";
}

/**
 * Get a log's content
 * @author Evorp, Juknum
 * @param log Log to format the content of
 * @returns Found log content
 */
export function formatLogContent(log: ActionLog) {
	if (log.data.content !== undefined) {
		if (log.data.content === "") return "Empty";
		return log.data.content;
	}

	// discord component (e.g. button, menu, modal)
	if (log.data.customId) return log.data.customId;

	// slash command interaction
	if (log.data.options) return `Parameters: ${JSON.stringify(log.data.options._hoistedOptions)}`;

	return "Unknown";
}
