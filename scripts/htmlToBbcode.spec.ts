import { describe, it, expect } from 'vitest';
import { htmlToBbcode, isLegacyHtmlNote } from './htmlToBbcode';
import { bbcodeToHtml } from '../src/lib/util/bbcode';

describe('htmlToBbcode', () => {
	it('converts the real-world nested span example', () => {
		const html =
			'<span style="color: #fb2c36; font-weight: 900;">' +
			'<span style="text-decoration: underline;">Saturday</span> slot is flexible.</span>';

		expect(htmlToBbcode(html)).toBe(
			'[color=#fb2c36][b][u]Saturday[/u] slot is flexible.[/b][/color]'
		);
	});

	it('maps formatting elements', () => {
		expect(htmlToBbcode('<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u>')).toBe(
			'[b]a[/b] [b]b[/b] [i]c[/i] [i]d[/i] [u]e[/u]'
		);
	});

	it('maps font styles and sizes', () => {
		expect(htmlToBbcode('<span style="font-style: italic">a</span>')).toBe('[i]a[/i]');
		expect(htmlToBbcode('<span style="font-size: 1.25rem">a</span>')).toBe('[size=1.25]a[/size]');
	});

	it('decodes entities and escapes brackets', () => {
		expect(htmlToBbcode('a &amp; b &lt;c&gt;')).toBe('a & b <c>');
		expect(htmlToBbcode('array[0]')).toBe('array[[0]');
	});

	it('unwraps unknown tags', () => {
		expect(htmlToBbcode('<div>a</div>')).toBe('a');
	});

	it('round-trips through bbcodeToHtml', () => {
		const html = '<span style="color:#7ccf00"><b>March</b>/dr stone to be <u>covered</u></span>';

		expect(bbcodeToHtml(htmlToBbcode(html))).toBe(html);
	});
});

describe('isLegacyHtmlNote', () => {
	it('detects legacy HTML but not BBCode', () => {
		expect(isLegacyHtmlNote('<span style="color:#fff">a</span>')).toBe(true);
		expect(isLegacyHtmlNote('[color=#fff]a[/color]')).toBe(false);
		expect(isLegacyHtmlNote('plain text <3')).toBe(false);
		expect(isLegacyHtmlNote('')).toBe(false);
		expect(isLegacyHtmlNote(null)).toBe(false);
	});
});
