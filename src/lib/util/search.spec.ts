import { describe, it, expect } from 'vitest';
import { filterSearch, getSearchTermValue, tokenizeSearchQuery, type SearchField } from './search';

describe('tokenizeSearchQuery', () => {
	it('splits on whitespace', () => {
		expect(tokenizeSearchQuery('foo bar  baz')).toEqual(['foo', 'bar', 'baz']);
	});

	it('keeps quoted terms together', () => {
		expect(tokenizeSearchQuery('"foo bar" baz')).toEqual(['"foo bar"', 'baz']);
	});
});

describe('getSearchTermValue', () => {
	it('detects negation and strips quotes', () => {
		expect(getSearchTermValue('-foo')).toEqual({ value: 'foo', negated: true });
		expect(getSearchTermValue('"foo bar"')).toEqual({ value: 'foo bar', negated: false });
	});
});

interface Item {
	title: string;
	links: number;
	urls: string[];
}

const items: Item[] = [
	{ title: 'Alpha', links: 0, urls: [] },
	{ title: 'Beta', links: 1, urls: ['https://youtube.com/watch?v=1'] },
	{
		title: 'Gamma',
		links: 2,
		urls: ['https://youtu.be/abc', 'https://patreon.com/gamma']
	}
];

const fields: Record<string, SearchField<Item>> = {
	links: { type: 'number', get: (item) => item.links },
	url: { type: 'text', get: (item) => item.urls },
	title: { type: 'text', get: (item) => item.title }
};

const fuzzyMatch = (item: Item, value: string) =>
	item.title.toLowerCase().includes(value.toLowerCase());

function search(query: string): string[] {
	return filterSearch(items, query, fields, fuzzyMatch).map((item) => item.title);
}

describe('filterSearch', () => {
	it('returns all items for an empty query', () => {
		expect(search('')).toEqual(['Alpha', 'Beta', 'Gamma']);
	});

	it('matches text fields case-insensitively', () => {
		expect(search('title:alph')).toEqual(['Alpha']);
	});

	it('matches number fields with equality and comparison operators', () => {
		expect(search('links:0')).toEqual(['Alpha']);
		expect(search('links:1')).toEqual(['Beta']);
		expect(search('links:>=2')).toEqual(['Gamma']);
		expect(search('links:>0')).toEqual(['Beta', 'Gamma']);
	});

	it('treats wildcards as globs', () => {
		expect(search('url:"*youtube*"')).toEqual(['Beta']);
	});

	it('supports negation', () => {
		expect(search('-url:"*youtube*"')).toEqual(['Alpha', 'Gamma']);
		expect(search('-links:1')).toEqual(['Alpha', 'Gamma']);
	});

	it('ANDs multiple terms', () => {
		expect(search('links:>0 -url:"*patreon*"')).toEqual(['Beta']);
	});

	it('falls back to fuzzy matching for bare terms', () => {
		expect(search('beta')).toEqual(['Beta']);
	});

	it('never matches unknown fields unless negated', () => {
		expect(search('nope:1')).toEqual([]);
		expect(search('-nope:1')).toEqual(['Alpha', 'Beta', 'Gamma']);
	});
});
