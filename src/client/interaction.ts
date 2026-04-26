import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	Role,
	StringSelectMenuInteraction,
	ModalSubmitInteraction,
	PermissionFlagsBits,
	InteractionReplyOptions,
	BaseInteraction,
	MessageFlags,
} from "discord.js";
import { strings, AllStrings } from "@helpers/strings";
import { EmbedBuilder } from "@client";
import { colors } from "@utility/colors";
import { Client as ExtendedClient, Message } from "@client";
import { AnyInteraction } from "@interfaces/interactions";

export type PermissionType = "manager" | "dev" | "moderator" | "council";

declare module "discord.js" {
	// applies to all interaction subtypes, much more convenient
	interface BaseInteraction {
		readonly client: ExtendedClient<true>; // so you don't have to cast it every time
		/**
		 * Load strings for a given interaction
		 * @author Evorp
		 * @param forceEnglish whether to only use english or determine language
		 * @returns all strings in the correct language
		 */
		strings(forceEnglish?: boolean): AllStrings;
		/**
		 * Check whether a user can run a given command
		 * @author Evorp
		 * @param type what role to check for
		 * @returns whether the user has permission or not
		 */
		hasPermission(type: PermissionType, warnUser?: boolean): boolean;
		/**
		 * Sends an ephemeral message to an already-deferred interaction
		 * @author Evorp
		 * @param options normal follow up options
		 * @returns sent message
		 */
		ephemeralReply(options: InteractionReplyOptions): Promise<Message>;
		/**
		 * Hack to remove the "The application did not respond" message when not replying
		 * @author Evorp
		 */
		complete(): Promise<Message | null>;
	}
}

function hasPermission(type: PermissionType, warnUser = true): boolean {
	const hasManager = this.member.permissions.has(PermissionFlagsBits.Administrator);
	const hasModerator = this.member.permissions.has(PermissionFlagsBits.ManageMessages);
	const hasDev = this.client.tokens.developers.includes(this.member.id);
	const hasCouncil = this.member.roles.cache.some((role: Role) =>
		role.name.toLowerCase().includes("council"),
	);

	const noPermission = new EmbedBuilder()
		.setTitle(this.strings().error.permission.notice)
		.setDescription(this.strings().error.permission.role_locked.replace("%TYPE%", type))
		.setColor(colors.red);

	let out: boolean;
	switch (type) {
		case "manager":
			out = hasManager;
			break;
		case "council":
			out = hasCouncil;
			break;
		case "dev":
			out = hasDev;
			break;
		case "moderator":
			out = hasModerator;
			break;
	}

	if (!out && warnUser) this.reply({ embeds: [noPermission], flags: MessageFlags.Ephemeral });
	return out;
}

async function ephemeralReply(this: AnyInteraction, options: InteractionReplyOptions) {
	// it's already deferred so we delete the non-ephemeral message
	await this.deleteReply().catch(() => {});
	return this.followUp({ ...options, flags: MessageFlags.Ephemeral });
}

async function complete(this: AnyInteraction) {
	const reply = this.deferred
		? await this.editReply({ content: "** **" })
		: await this.reply({ content: "** **", withResponse: true }).then(
				({ resource }) => resource.message,
			);
	return reply.delete().catch(() => null);
}

// adding them here adds them everywhere (thank you runtime prototypal inheritance)
BaseInteraction.prototype.hasPermission = hasPermission;
BaseInteraction.prototype.strings = strings;
BaseInteraction.prototype.ephemeralReply = ephemeralReply;
BaseInteraction.prototype.complete = complete;

export {
	ChatInputCommandInteraction,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
};
