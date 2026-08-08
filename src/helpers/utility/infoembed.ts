import { getEmoji, emojis } from "@utility/emojis";
import { APIEmbed } from "discord.js";

export const media: Record<string, APIEmbed> = {
	faithful_32x: {
		title: "Faithful 32x",
		description: `
[${getEmoji(emojis.main_logo)} Website](https://faithfulpack.net/faithful32x)
[${getEmoji(emojis.curseforge)} Java Edition CurseForge](https://curseforge.com/minecraft/texture-packs/faithful-32x)
[${getEmoji(emojis.curseforge)} Bedrock Edition CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/faithful-32x-bedrock)
[${getEmoji(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/faithful-32x)
[${getEmoji(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/faithful-32x/)
[${getEmoji(emojis.github)} Java Edition GitHub](https://github.com/faithful-resource-pack/faithful-32x-java)
[${getEmoji(emojis.github)} Bedrock Edition GitHub](https://github.com/faithful-resource-pack/faithful-32x-bedrock)`,
	},
	faithful_64x: {
		title: "Faithful 64x",
		description: `
[${getEmoji(emojis.main_logo)} Website](https://faithfulpack.net/faithful64x)
[${getEmoji(emojis.curseforge)} Java Edition CurseForge](https://curseforge.com/minecraft/texture-packs/faithful-64x)
[${getEmoji(emojis.curseforge)} Bedrock Edition CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/faithful-64x-bedrock)
[${getEmoji(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/faithful-64x)
[${getEmoji(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/faithful-64x/)
[${getEmoji(emojis.github)} Java Edition GitHub](https://github.com/faithful-resource-pack/faithful-64x-java)
[${getEmoji(emojis.github)} Bedrock Edition GitHub](https://github.com/faithful-resource-pack/faithful-64x-bedrock)
    `,
	},

	classic_faithful_32x: {
		title: "Classic Faithful 32x",
		description: `
[${getEmoji(emojis.main_logo)} Website](https://faithfulpack.net/classic32x)
[${getEmoji(emojis.curseforge)} CurseForge](https://www.curseforge.com/minecraft/texture-packs/classic-faithful-32x)
[${getEmoji(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/classic-faithful-32x)
[${getEmoji(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-32x-pa)
[${getEmoji(emojis.github)} Java Edition GitHub](https://github.com/classicfaithful/classic-32x-java)
[${getEmoji(emojis.github)} Bedrock Edition GitHub](https://github.com/classicfaithful/classic-32x-bedrock)
    `,
	},

	classic_faithful_32x_jappa: {
		title: "Classic Faithful 32x Jappa",
		description: `
[${getEmoji(emojis.main_logo)} Website](https://faithfulpack.net/classic32x-jappa)
[${getEmoji(emojis.curseforge)} CurseForge](https://www.curseforge.com/minecraft/texture-packs/classic-faithful-32x-jappa)
[${getEmoji(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/classic-faithful-32x-jappa)
[${getEmoji(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-32x)
[${getEmoji(emojis.github)} Java Edition GitHub](https://github.com/classicfaithful/classic-32x-jappa-java)
[${getEmoji(emojis.github)} Bedrock Edition GitHub](https://github.com/classicfaithful/classic-32x-jappa-bedrock)
    `,
	},

	classic_faithful_64x_jappa: {
		title: "Classic Faithful 64x Jappa",
		description: `
[${getEmoji(emojis.main_logo)} Website](https://faithfulpack.net/classic64x-jappa)
[${getEmoji(emojis.curseforge)} CurseForge](https://www.curseforge.com/minecraft/texture-packs/classic-faithful-64x-jappa)
[${getEmoji(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/classic-faithful-64x-jappa)
[${getEmoji(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-64x/)
[${getEmoji(emojis.github)} Java Edition GitHub](https://github.com/classicfaithful/classic-64x-jappa-java)
[${getEmoji(emojis.github)} Bedrock Edition GitHub](https://github.com/classicfaithful/classic-64x-jappa-bedrock)
    `,
	},

	default: {
		title: "Quick Links",
		fields: [
			{
				name: "Information",
				value: `
[Website](https://faithfulpack.net/)
[Studio](https://studio.faithfulpack.net)
[About Us](https://faithfulpack.net/about)
[License](https://faithfulpack.net/license)
[Status](https://status.faithfulpack.net/)`,
				inline: true,
			},
			{
				name: "Listings",
				value: `
[CurseForge](https://www.curseforge.com/members/faithful_resource_pack/projects)
[Modrinth](https://modrinth.com/organization/faithful-resource-pack)
[Planet Minecraft](https://planetminecraft.com/member/faithful_resource_pack/)
[Main GitHub](https://github.com/faithful-resource-pack/)
[Classic GitHub](https://github.com/classicfaithful/)`,
				inline: true,
			},
			{
				name: "Other",
				value: `
[Twitter](https://twitter.com/faithfulpack/)
[Bluesky](https://bsky.app/profile/faithfulpack.net)
[Translations](https://translate.faithfulpack.net)
[Texture Gallery](https://studio.faithfulpack.net/gallery)
[Faithful Docs](https://docs.faithfulpack.net/)`,
				inline: true,
			},
		],
	},
};
