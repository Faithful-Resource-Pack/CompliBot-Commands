/**
 * Sorts a given collection of Minecraft versions
 * @example [].sort(versionSorter)
 * @author TheRolf, Evorp
 */
export default function versionSorter(a: string, b: string) {
	const aStrings = a.split(".");
	const aNumbers = aStrings.map((part) => Number(part));
	const bStrings = b.split(".");
	const bNumbers = bStrings.map((part) => Number(part));

	// non-numbered versions go above everything else
	if (aNumbers.every((a) => isNaN(a)) || bNumbers.every((b) => isNaN(b))) {
		return a.localeCompare(b);
	}

	// compare only the safely accessible parts (1.17 vs 1.18.2 ignores the .2)
	const upper = Math.min(aNumbers.length, bNumbers.length);

	// compare each part by priority and immediately return if we find a difference
	for (let i = 0; i < upper; ++i) {
		const result = aNumbers[i] - bNumbers[i];
		// any version with a letter in it (e.g. b1.7.3) goes below everything else
		if (isNaN(result)) return bStrings[i].localeCompare(aStrings[i]);
		if (result !== 0) return result;
	}

	// each part in the safe boundary is the same, try for differing length (1.17 vs 1.17.1)
	return aNumbers.length - bNumbers.length;
}
