const COLOR_PATTERN = /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|[a-z]+)$/i;
const SIZE_PATTERN = /^(\d+(?:\.\d+)?)(?:rem)?$/i;
const ALIASES: Record<string, string> = { c: 'color', s: 'size' };
const TAG_NAMES = new Set(['b', 'i', 'u', 'color', 'size']);
const TAG_PATTERN = /^(\/?)([a-zA-Z]+)(?:=([\s\S]*))?$/;

interface BbcodeTag {
	name: string;
	open: string;
	close: string;
}

function buildTag(name: string, value: string | undefined): BbcodeTag | null {
	switch (name) {
		case 'b':
			return { name, open: '<b>', close: '</b>' };
		case 'i':
			return { name, open: '<i>', close: '</i>' };
		case 'u':
			return { name, open: '<u>', close: '</u>' };
		case 'color': {
			const color = (value ?? '').trim();
			if (!COLOR_PATTERN.test(color)) return null;
			return { name, open: `<span style="color:${color}">`, close: '</span>' };
		}
		case 'size': {
			const match = SIZE_PATTERN.exec((value ?? '').trim());
			if (!match) return null;
			const size = Number(match[1]);
			if (!Number.isFinite(size) || size <= 0) return null;
			return { name, open: `<span style="font-size:${match[1]}rem">`, close: '</span>' };
		}
		default:
			return null;
	}
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function bbcodeToHtml(input: string | null | undefined): string {
	const source = input ?? '';
	const out: string[] = [];
	const stack: BbcodeTag[] = [];
	let i = 0;

	while (i < source.length) {
		if (source[i] !== '[') {
			const next = source.indexOf('[', i);
			const end = next === -1 ? source.length : next;
			out.push(escapeHtml(source.slice(i, end)));
			i = end;
			continue;
		}

		if (source[i + 1] === '[') {
			out.push('[');
			i += 2;
			continue;
		}

		const closeIndex = source.indexOf(']', i + 1);
		if (closeIndex === -1) {
			out.push(escapeHtml(source.slice(i)));
			break;
		}

		const match = TAG_PATTERN.exec(source.slice(i + 1, closeIndex));
		const rawName = match?.[2].toLowerCase();
		const name = rawName ? (ALIASES[rawName] ?? rawName) : '';

		if (!match || !TAG_NAMES.has(name)) {
			out.push(escapeHtml(source.slice(i, closeIndex + 1)));
			i = closeIndex + 1;
			continue;
		}

		if (match[1] === '/') {
			let index = -1;
			for (let k = stack.length - 1; k >= 0; k--) {
				if (stack[k].name === name) {
					index = k;
					break;
				}
			}

			if (index === -1) {
				i = closeIndex + 1;
				continue;
			}

			const nested = stack.splice(index);
			for (let k = nested.length - 1; k >= 1; k--) out.push(nested[k].close);
			out.push(nested[0].close);
			for (let k = 1; k < nested.length; k++) {
				out.push(nested[k].open);
				stack.push(nested[k]);
			}
		} else {
			const value = match[3]?.trim().replace(/^["']|["']$/g, '');
			const raw = source.slice(i, closeIndex + 1);
			const tag = buildTag(name, value);
			if (tag) {
				out.push(tag.open);
				stack.push(tag);
			} else {
				out.push(escapeHtml(raw));
				stack.push({ name, open: escapeHtml(raw), close: `[/${name}]` });
			}
		}

		i = closeIndex + 1;
	}

	for (let k = stack.length - 1; k >= 0; k--) out.push(stack[k].close);
	return out.join('');
}

export function bbcodeToText(input: string | null | undefined): string {
	return bbcodeToHtml(input)
		.replace(/<[^>]*>/g, '')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}
