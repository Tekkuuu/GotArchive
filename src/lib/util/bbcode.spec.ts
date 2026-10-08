import { describe, it, expect } from 'vitest';
import { bbcodeToHtml, bbcodeToText } from './bbcode';

describe('bbcodeToHtml', () => {
	it('maps formatting tags', () => {
		expect(bbcodeToHtml('[b]a[/b] [i]b[/i] [u]c[/u]')).toBe('<b>a</b> <i>b</i> <u>c</u>');
	});

	it('maps colour and size tags, including aliases', () => {
		expect(bbcodeToHtml('[color=#fb2c36]a[/color]')).toBe('<span style="color:#fb2c36">a</span>');
		expect(bbcodeToHtml('[c=red]a[/c]')).toBe('<span style="color:red">a</span>');
		expect(bbcodeToHtml('[size=1.25]a[/size]')).toBe('<span style="font-size:1.25rem">a</span>');
		expect(bbcodeToHtml('[s=2]a[/s]')).toBe('<span style="font-size:2rem">a</span>');
	});

	it('escapes HTML in text', () => {
		expect(bbcodeToHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(bbcodeToHtml('a & b')).toBe('a &amp; b');
	});

	it('supports [[ as a literal bracket', () => {
		expect(bbcodeToHtml('[[b] not bold')).toBe('[b] not bold');
	});

	it('keeps unknown tags literal', () => {
		expect(bbcodeToHtml('[quote]hi[/quote]')).toBe('[quote]hi[/quote]');
		expect(bbcodeToHtml('[color=javascript:alert(1)]x[/color]')).toBe(
			'[color=javascript:alert(1)]x[/color]'
		);
	});

	it('re-opens tags when nesting is malformed', () => {
		expect(bbcodeToHtml('[b]a[color=#fff]b[/b]c[/color]')).toBe(
			'<b>a<span style="color:#fff">b</span></b><span style="color:#fff">c</span>'
		);
	});

	it('drops stray closing tags', () => {
		expect(bbcodeToHtml('[b]a[/i][/b]')).toBe('<b>a</b>');
	});

	it('handles empty input', () => {
		expect(bbcodeToHtml('')).toBe('');
		expect(bbcodeToHtml(null)).toBe('');
		expect(bbcodeToHtml(undefined)).toBe('');
	});
});

describe('bbcodeToText', () => {
	it('flattens formatting to plain text', () => {
		expect(bbcodeToText('[color=#fff][b]Hello[/b] world[/color]')).toBe('Hello world');
		expect(bbcodeToText('[size=1.25]Streams[/size] at 8:30')).toBe('Streams at 8:30');
	});

	it('un-escapes text and collapses whitespace', () => {
		expect(bbcodeToText('a & b')).toBe('a & b');
		expect(bbcodeToText('a <c>')).toBe('a <c>');
		expect(bbcodeToText('one\ntwo')).toBe('one two');
	});

	it('handles empty input', () => {
		expect(bbcodeToText('')).toBe('');
		expect(bbcodeToText(null)).toBe('');
	});
});
