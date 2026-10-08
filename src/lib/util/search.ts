export type SearchFieldType = 'text' | 'number' | 'date';

/**
 * Describes how a single `field:value` term is matched against an item.
 * `get` returns one value or a list of values to test (a match succeeds if any
 * value satisfies the term). `match` overrides the built-in matcher entirely.
 */
export type SearchField<T> = {
	type: SearchFieldType;
	get: (item: T) => unknown | unknown[];
	match?: (item: T, value: string) => boolean;
};

type ParsedSearchTerm = {
	field: string;
	value: string;
	operator: string;
	negated: boolean;
};

/** Splits a query into whitespace-separated terms, honouring double quotes. */
export function tokenizeSearchQuery(query: string): string[] {
	const terms: string[] = [];
	let current = '';
	let quote: string | null = null;

	for (const character of query) {
		if (quote) {
			current += character;
			if (character === quote) quote = null;
		} else if (character === '"') {
			quote = character;
			current += character;
		} else if (/\s/.test(character)) {
			if (current) terms.push(current);
			current = '';
		} else {
			current += character;
		}
	}

	if (current) terms.push(current);
	return terms;
}

/** Strips an optional leading `-` (negation) and surrounding quotes. */
export function getSearchTermValue(term: string): { value: string; negated: boolean } {
	const negated = term.startsWith('-');
	const value = (negated ? term.slice(1) : term).replace(/^"(.*)"$/, '$1');
	return { value, negated };
}

function parseSearchTerm(term: string): ParsedSearchTerm {
	const { value: positiveTerm, negated } = getSearchTermValue(term);
	const colon = positiveTerm.indexOf(':');
	const field = colon === -1 ? '' : positiveTerm.slice(0, colon).toLowerCase();
	const rawValue = colon === -1 ? positiveTerm : positiveTerm.slice(colon + 1);
	const match = rawValue.match(/^(<=|>=|<|>)?\s*(.*)$/);

	return {
		field,
		operator: match?.[1] ?? '',
		value: getSearchTermValue((match?.[2] ?? rawValue).trim()).value,
		negated
	};
}

function valuesOf(value: unknown | unknown[]): unknown[] {
	return Array.isArray(value) ? value : [value];
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive text match. Values containing `*` or `?` are treated as a
 * glob (`*youtube*` matches any URL containing "youtube"); otherwise a plain
 * substring match is used.
 */
function matchesText(value: string, pattern: string): boolean {
	const lowerValue = value.toLowerCase();
	const lowerPattern = pattern.toLowerCase();

	if (!lowerPattern.includes('*') && !lowerPattern.includes('?')) {
		return lowerValue.includes(lowerPattern);
	}

	const regex = escapeRegExp(lowerPattern).replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
	return new RegExp(`^${regex}$`).test(lowerValue);
}

function matchesField<T>(item: T, field: SearchField<T>, term: ParsedSearchTerm): boolean {
	const values = valuesOf(field.get(item)).filter(
		(value) => value !== null && value !== undefined && value !== ''
	);
	if (term.value === '' || values.length === 0) return false;
	if (field.match) return field.match(item, term.value);

	if (field.type === 'text') {
		return values.some((value) => matchesText(String(value), term.value));
	}

	if (field.type === 'number') {
		const numbers = values.map(Number).filter((value) => !Number.isNaN(value));
		const target = Number(term.value);
		if (Number.isNaN(target)) {
			return numbers.some((value) => matchesText(String(value), term.value));
		}
		return numbers.some((value) => {
			if (term.operator === '>') return value > target;
			if (term.operator === '<') return value < target;
			if (term.operator === '>=') return value >= target;
			if (term.operator === '<=') return value <= target;
			return value === target;
		});
	}

	return values.some((value) => {
		const date = new Date(String(value));
		const target = Date.parse(term.value);
		if (Number.isNaN(date.getTime())) return false;
		if (Number.isNaN(target)) return false;
		if (term.operator === '>') return date.getTime() > target;
		if (term.operator === '<') return date.getTime() < target;
		if (term.operator === '>=') return date.getTime() >= target;
		if (term.operator === '<=') return date.getTime() <= target;
		return date.toDateString() === new Date(target).toDateString();
	});
}

/**
 * Filters `items` by a search query. Field terms (`field:value`) are matched by
 * the matching entry in `fields`; bare terms fall through to `fuzzyMatch`.
 * Every term must match (AND); prefix a term with `-` to negate it.
 */
export function filterSearch<T>(
	items: T[],
	query: string,
	fields: Record<string, SearchField<T>>,
	fuzzyMatch: (item: T, value: string) => boolean
): T[] {
	const terms = tokenizeSearchQuery(query.trim());
	if (terms.length === 0) return items;

	return items.filter((item) =>
		terms.every((rawTerm) => {
			const term = parseSearchTerm(rawTerm);
			if (!term.value) return true;

			const matched = term.field
				? fields[term.field]
					? matchesField(item, fields[term.field], term)
					: false
				: fuzzyMatch(item, term.value);
			return term.negated ? !matched : matched;
		})
	);
}
