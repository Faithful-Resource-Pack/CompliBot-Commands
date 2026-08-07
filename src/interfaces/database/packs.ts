import { MinecraftEdition } from "./textures";

export interface Pack {
	id: string;
	name: string;
	tags: string[];
	logo: string;
	resolution: number;
	github: Record<MinecraftEdition, PackGitHub>;
}

export interface PackGitHub {
	org: string;
	repo: string;
}
