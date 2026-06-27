/**
 * Sorts a given collection of Minecraft versions
 * @example [].sort(versionSorter)
 * @author TheRolf, Evorp
 */
export default function versionSorter(a: string, b: string) {
	const aStrings = a.split(".");
	const aNumbers = aStrings.map((aPart) => Number(aPart));
	const bStrings = b.split(".");
	const bNumbers = bStrings.map((bPart) => Number(bPart));

	// non-numbered versions go above everything else
	if (
		aNumbers.every((aPart) => Number.isNaN(aPart)) ||
		bNumbers.every((bPart) => Number.isNaN(bPart))
	)
		return a.localeCompare(b);

	// compare only the safely accessible parts (1.17 vs 1.18.2 ignores the .2)
	const upper = Math.min(aStrings.length, bStrings.length);

	// compare each part by priority (a1.4 < b1.3 < 1.2 < 2.1)
	for (let i = 0; i < upper; ++i) {
		const aNaN = Number.isNaN(aNumbers[i]);
		const bNaN = Number.isNaN(bNumbers[i]);

		// if javascript had real pattern matching this would be so much nicer
		let result: number;
		if (aNaN && !bNaN) result = -1;
		else if (!aNaN && bNaN) result = 1;
		else if (aNaN && bNaN) result = aStrings[i].localeCompare(bStrings[i]);
		else result = aNumbers[i] - bNumbers[i];

		// return difference if exists, proceed to minor/patch otherwise
		if (result !== 0) return result;
	}

	// each part in the safe boundary is the same, check length (1.17 < 1.17.1)
	return aNumbers.length - bNumbers.length;
}
