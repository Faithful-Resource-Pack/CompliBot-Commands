/**
 * Simple object check.
 * @param item item to check.
 * @returns true if item is an object
 */
export const isObject = (item: unknown) =>
	item !== null && item !== undefined && typeof item === "object" && !Array.isArray(item);

/**
 * Merge two objects into the targeted object/array
 * @author Juknum
 * @param target where to add sources to
 * @param sources what to add
 * @returns merged sources
 */
export function mergeDeep<T = unknown>(target: T, ...sources: T[]) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else Object.assign(target, { [key]: source[key] });
		}
	}

	return mergeDeep(target, ...sources);
}

/** make the first letter of each word in a string uppercase */
export const toTitleCase = (str: string) =>
	str
		.split(/_|-| /g)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");

/** random integer between the given start and stop points */
export const randint = (start: number, stop: number) =>
	Math.floor(start + Math.random() * (stop - start + 1));
/** pick a random item out of an array */
export const choice = <T>(arr: T[]): T => arr[randint(0, arr.length - 1)];
