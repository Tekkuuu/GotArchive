import { describe, it, expect } from 'vitest';
import { sanitizeHexColor, sanitizeIconSvg, sanitizeNote } from './sanitizeHtml';

describe('sanitizeNote', () => {
	it('returns null for empty, null, or undefined input', () => {
		expect(sanitizeNote(null)).toBeNull();
		expect(sanitizeNote(undefined)).toBeNull();
		expect(sanitizeNote('')).toBeNull();
		expect(sanitizeNote('   ')).toBeNull();
	});

	it('preserves the inline styling used by real schedule notes', () => {
		const note =
			'<span style="color: #fb2c36; font-weight: 900;">One piece subathon on hold</span>\n' +
			'<span style="color: #7ccf00; font-weight: 900;">March/dr stone to be covered</span>';
		const result = sanitizeNote(note);

		expect(result).toContain('color:#fb2c36');
		expect(result).toContain('font-weight:900');
		expect(result).toContain('color:#7ccf00');
		expect(result).toContain('One piece subathon on hold');
	});

	it('preserves text-decoration and allowed formatting tags', () => {
		const result = sanitizeNote(
			'<span style="text-decoration: underline">Sunday</span> <b>bold</b>'
		);

		expect(result).toContain('text-decoration:underline');
		expect(result).toContain('<b>bold</b>');
	});

	it('preserves rem font sizes and strips other units', () => {
		expect(sanitizeNote('<span style="font-size: 1.25rem">big</span>')).toContain(
			'font-size:1.25rem'
		);
		expect(sanitizeNote('<span style="font-size: 20px">big</span>')).not.toContain('20px');
	});

	it('strips <script> tags and their contents', () => {
		const result = sanitizeNote('hello<script>alert(1)</script>world');

		expect(result).not.toContain('<script');
		expect(result).not.toContain('alert(1)');
		expect(result).toBe('helloworld');
	});

	it('strips event-handler attributes', () => {
		const result = sanitizeNote('<span onclick="alert(1)" style="color: red">hi</span>');

		expect(result).not.toContain('onclick');
		expect(result).toContain('hi');
	});

	it('strips disallowed tags such as <img> and <iframe>', () => {
		const result = sanitizeNote('<img src="x" onerror="alert(1)"><iframe src="evil"></iframe>ok');

		expect(result).not.toContain('<img');
		expect(result).not.toContain('onerror');
		expect(result).not.toContain('<iframe');
		expect(result).toContain('ok');
	});

	it('strips javascript: URLs in style values', () => {
		const result = sanitizeNote('<span style="color: expression(alert(1))">x</span>');

		expect(result).not.toContain('expression');
		expect(result).toContain('x');
	});

	it('removes disallowed CSS properties from style', () => {
		const result = sanitizeNote('<span style="position: fixed; color: red">x</span>');

		expect(result).not.toContain('position');
		expect(result).toContain('color:red');
	});

	it('leaves plain text untouched', () => {
		expect(sanitizeNote('Streams at 8:30 PM BST/3:30 PM EDT')).toBe(
			'Streams at 8:30 PM BST/3:30 PM EDT'
		);
	});
});

describe('sanitizeIconSvg', () => {
	const YOUTUBE_SVG =
		'<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>YouTube</title><path d="M23.5 6.2h1v5h-1z"/></svg>';

	it('returns null for empty, null, or undefined input', () => {
		expect(sanitizeIconSvg(null)).toBeNull();
		expect(sanitizeIconSvg(undefined)).toBeNull();
		expect(sanitizeIconSvg('')).toBeNull();
	});

	it('preserves simple-icons markup and adds currentColor fill', () => {
		const result = sanitizeIconSvg(YOUTUBE_SVG);

		expect(result).toContain('<svg');
		expect(result).toMatch(/viewbox="0 0 24 24"/i);
		expect(result).toContain('<title>YouTube</title>');
		expect(result).toContain('<path fill="currentColor"');
	});

	it('keeps an explicit fill instead of overriding it', () => {
		const result = sanitizeIconSvg(
			'<svg viewBox="0 0 24 24"><path d="M0 0h1v1H0z" fill="#FF0033"/></svg>'
		);

		expect(result).toContain('fill="#FF0033"');
		expect(result).not.toContain('currentColor');
	});

	it('strips scripts, event handlers, and style attributes', () => {
		const result = sanitizeIconSvg(
			'<svg viewBox="0 0 24 24" onload="alert(1)"><path d="M0 0h1v1H0z" style="fill: red"/><script>alert(1)</script></svg>'
		);

		expect(result).not.toContain('onload');
		expect(result).not.toContain('<script');
		expect(result).not.toContain('style=');
		expect(result).toContain('<path');
	});
});

describe('sanitizeHexColor', () => {
	it('accepts #rrggbb and trims whitespace', () => {
		expect(sanitizeHexColor('#9146FF')).toBe('#9146FF');
		expect(sanitizeHexColor('  #ff0033  ')).toBe('#ff0033');
	});

	it('rejects empty, malformed, or injectable values', () => {
		expect(sanitizeHexColor(null)).toBeNull();
		expect(sanitizeHexColor('')).toBeNull();
		expect(sanitizeHexColor('red')).toBeNull();
		expect(sanitizeHexColor('#fff')).toBeNull();
		expect(sanitizeHexColor('#9146FF; background: red')).toBeNull();
		expect(sanitizeHexColor('"; alert(1); "')).toBeNull();
	});
});
