import { parseID, emojis } from "@utility/emojis";
import { APIEmbed } from "discord.js";

export const media: Record<string, APIEmbed> = {
	faithful_32x: {
		title: "Faithful 32x",
		description: `
[${parseID(emojis.main_logo)} Website](https://faithfulpack.net/faithful32x)
[${parseID(emojis.curseforge)} Java Edition CurseForge](https://curseforge.com/minecraft/texture-packs/faithful-32x)
[${parseID(emojis.curseforge)} Bedrock Edition CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/faithful-32x-bedrock)
[${parseID(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/faithful-32x)
[${parseID(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/faithful-32x/)
[${parseID(emojis.github)} Java Edition GitHub](https://github.com/faithful-resource-pack/faithful-32x-java)
[${parseID(emojis.github)} Bedrock Edition GitHub](https://github.com/faithful-resource-pack/faithful-32x-bedrock)`,
	},
	faithful_64x: {
		title: "Faithful 64x",
		description: `
[${parseID(emojis.main_logo)} Website](https://faithfulpack.net/faithful64x)
[${parseID(emojis.curseforge)} Java Edition CurseForge](https://curseforge.com/minecraft/texture-packs/faithful-64x)
[${parseID(emojis.curseforge)} Bedrock Edition CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/faithful-64x-bedrock)
[${parseID(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/faithful-64x)
[${parseID(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/faithful-64x/)
[${parseID(emojis.github)} Java Edition GitHub](https://github.com/faithful-resource-pack/faithful-64x-java)
[${parseID(emojis.github)} Bedrock Edition GitHub](https://github.com/faithful-resource-pack/faithful-64x-bedrock)
    `,
	},

	classic_faithful_32x: {
		title: "Classic Faithful 32x",
		description: `
[${parseID(emojis.main_logo)} Website](https://faithfulpack.net/classic32x)
[${parseID(emojis.curseforge)} CurseForge](https://www.curseforge.com/minecraft/texture-packs/classic-faithful-32x)
[${parseID(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/classic-faithful-32x)
[${parseID(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-32x-pa)
[${parseID(emojis.github)} Java Edition GitHub](https://github.com/classicfaithful/classic-32x-java)
[${parseID(emojis.github)} Bedrock Edition GitHub](https://github.com/classicfaithful/classic-32x-bedrock)
    `,
	},

	classic_faithful_32x_jappa: {
		title: "Classic Faithful 32x Jappa",
		description: `
[${parseID(emojis.main_logo)} Website](https://faithfulpack.net/classic32x-jappa)
[${parseID(emojis.curseforge)} CurseForge](https://www.curseforge.com/minecraft/texture-packs/classic-faithful-32x-jappa)
[${parseID(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/classic-faithful-32x-jappa)
[${parseID(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-32x)
[${parseID(emojis.github)} Java Edition GitHub](https://github.com/classicfaithful/classic-32x-jappa-java)
[${parseID(emojis.github)} Bedrock Edition GitHub](https://github.com/classicfaithful/classic-32x-jappa-bedrock)
    `,
	},

	classic_faithful_64x_jappa: {
		title: "Classic Faithful 64x Jappa",
		description: `
[${parseID(emojis.main_logo)} Website](https://faithfulpack.net/classic64x-jappa)
[${parseID(emojis.curseforge)} CurseForge](https://www.curseforge.com/minecraft/texture-packs/classic-faithful-64x-jappa)
[${parseID(emojis.modrinth)} Modrinth](https://modrinth.com/resourcepack/classic-faithful-64x-jappa)
[${parseID(emojis.pmc)} Planet Minecraft](https://planetminecraft.com/texture-pack/classic-faithful-64x/)
[${parseID(emojis.github)} Java Edition GitHub](https://github.com/classicfaithful/classic-64x-jappa-java)
[${parseID(emojis.github)} Bedrock Edition GitHub](https://github.com/classicfaithful/classic-64x-jappa-bedrock)
    `,
	},

	default: {
		title: "Quick Links",
		fields: [
			{
				name: "Information",
				value: `
[Website](https://faithfulpack.net/)
[Web App](https://webapp.faithfulpack.net)
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
[Texture Gallery](https://webapp.faithfulpack.net/gallery)
[Faithful Docs](https://docs.faithfulpack.net/)`,
				inline: true,
			},
		],
	},
};
