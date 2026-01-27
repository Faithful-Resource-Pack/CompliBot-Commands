export type MinecraftEdition = "java" | "bedrock";

export interface Path {
	id: string;
	use: string; // use ID
	name: string; // texture path
	mcmeta: boolean; // true if animated
	versions: string[]; // texture versions
}

export interface Use {
	id: string;
	name: string | null;
	edition: MinecraftEdition;
	texture: number; // texture ID
}

// when you don't add the "all" flag when searching on the API
export interface BaseTexture {
	id: string;
	name: string;
	tags: string[];
}

export interface Texture extends BaseTexture {
	uses: Use[];
	paths: Path[];
	contributions: Contribution[];
	mcmeta?: MCMETA;
}

// used for comparison loader
export interface GalleryTexture extends Omit<Texture, keyof BaseTexture> {
	// texture properties are moved into their own key
	texture: BaseTexture;
	urls: Record<string, string>;
}

export interface Contribution {
	id: string;
	date: number; // unix timestamp
	texture: number; // texture ID
	pack: string;
	authors: string[];
}

export interface Contributor {
	id: string;
	contributions: number;
	username?: string;
	uuid?: string;
}

export interface MCMETA {
	animation?: Partial<{
		frametime: number;
		interpolate: boolean;
		frames: (number | { index?: number; time?: number })[];
		height: number;
		width: number;
	}>;
}
