// note: the key name should be the same as the emoji name
export const emojis = {
	// listings
	pmc: "863132124333080576",
	curseforge: "1353188028000108574",
	modrinth: "1129458572095397965",
	github: "1129461571601567855",
	mcpedl: "1129458566659575918",
	// project logos
	main_logo: "1324112546176700530",
	f32_logo: "1324112542871589004",
	f64_logo: "1324112544557957160",
	add_ons_logo: "1324112525767479298",
	mods_logo: "1324112547997028513",
	cf_main_logo: "1324112528258895902",
	cf32_logo: "1324112533526941828",
	cf32j_logo: "1324112535892263003",
	cf64_logo: "1324112539038257162",
	cf64j_logo: "1324112540720037960",
	// image buttons
	magnify: "918186631226339339",
	palette: "918186650822131742",
	delete: "1103485671903076403",
	compare: "918186583176405032",
	tile: "918186692307996723",
	flip: "942325434308243497",
	rotate: "942325479661256754",
	question_mark: "1181025437560877087",
	cycle: "918186640571256842",
	// poll buttons
	upvote: "918186701975859307",
	downvote: "918186603007078420",
} as const;

/**
 * Convert a reaction id into an inline emoji string
 * @author Nick
 * @param id emoji id
 * @returns usable string
 */
export function getEmoji(id: string) {
	// <:name:id>
	return `<:${Object.keys(emojis).find((key) => emojis[key] === id)}:${id}>`;
}

export type AvailableEmoji = keyof typeof emojis;
