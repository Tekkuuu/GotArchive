const COLOR_PATTERN = /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|[a-z]+)$/i;
const SIZE_PATTERN = /^(\d+(?:\.\d+)?)(?:rem)?$/i;

function decodeEntities(text: string): string {
	const named: Record<string, string> = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: "'",
		nbsp: ' '
	};

	return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity: string) => {
		if (entity[0] === '#') {
			const hex = entity[1]?.toLowerCase() === 'x';
			const code = parseInt(hex ? entity.slice(2) : entity.slice(1), hex ? 16 : 10);
			return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : full;
		}
		return named[entity.toLowerCase()] ?? full;
	});
}

function escapeBbcodeText(text: string): string {
	return text.replace(/\[/g, '[[');
}

function styleToBbcode(style: string): string[] {
	const tags: string[] = [];

	for (const declaration of style.split(';')) {
		const separator = declaration.indexOf(':');
		if (separator === -1) continue;

		const property = declaration.slice(0, separator).trim().toLowerCase();
		const value = declaration.slice(separator + 1).trim();

		switch (property) {
			case 'color':
				if (COLOR_PATTERN.test(value)) tags.push(`color=${value}`);
				break;
			case 'font-size': {
				const match = SIZE_PATTERN.exec(value);
				if (match) tags.push(`size=${match[1]}`);
				break;
			}
			case 'font-weight':
				if (/^(bold|bolder|[6-9]00)$/i.test(value)) tags.push('b');
				break;
			case 'font-style':
				if (/^(italic|oblique)$/i.test(value)) tags.push('i');
				break;
			case 'text-decoration':
				if (/\bunderline\b/i.test(value)) tags.push('u');
				break;
		}
	}

	return [...new Set(tags)];
}

function htmlTagToBbcode(name: string, attributes: string): string[] {
	switch (name) {
		case 'b':
		case 'strong':
			return ['b'];
		case 'i':
		case 'em':
			return ['i'];
		case 'u':
			return ['u'];
		case 'span': {
			const match = /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attributes);
			return styleToBbcode(match?.[1] ?? match?.[2] ?? '');
		}
		default:
			return [];
	}
}

export function htmlToBbcode(html: string): string {
	const out: string[] = [];
	const stack: Array<{ closeTag: string; tags: string[] }> = [];
	let i = 0;

	while (i < html.length) {
		const lt = html.indexOf('<', i);

		if (lt === -1) {
			out.push(escapeBbcodeText(decodeEntities(html.slice(i))));
			break;
		}
		if (lt > i) {
			out.push(escapeBbcodeText(decodeEntities(html.slice(i, lt))));
		}

		const gt = html.indexOf('>', lt);
		if (gt === -1) {
			out.push(escapeBbcodeText(decodeEntities(html.slice(lt))));
			break;
		}

		const tag = html.slice(lt + 1, gt).trim();
		i = gt + 1;

		if (tag.startsWith('!') || tag.startsWith('?')) continue;

		const nameMatch = /^\/?([a-zA-Z][a-zA-Z0-9]*)/.exec(tag);
		if (!nameMatch) continue;

		const name = nameMatch[1].toLowerCase();
		const attributes = tag.slice(nameMatch[0].length).replace(/\/$/, '').trim();

		if (name === 'br') {
			out.push('\n');
			continue;
		}

		if (!tag.startsWith('/')) {
			const tags = htmlTagToBbcode(name, attributes);
			for (const token of tags) out.push(`[${token}]`);
			stack.push({ closeTag: name, tags });
			continue;
		}

		let index = -1;
		for (let k = stack.length - 1; k >= 0; k--) {
			if (stack[k].closeTag === name) {
				index = k;
				break;
			}
		}
		if (index === -1) continue;

		const nested = stack.splice(index);
		for (let k = nested.length - 1; k >= 0; k--) {
			for (let j = nested[k].tags.length - 1; j >= 0; j--) {
				out.push(`[/${nested[k].tags[j].split('=')[0]}]`);
			}
		}
	}

	return out.join('');
}

export function isLegacyHtmlNote(note: string | null | undefined): boolean {
	if (!note) return false;
	if (/\[(?:b|i|u|color|c|size|s)(?:=[^\]]*)?\]/i.test(note)) return false;
	return /<\/?(?:span|b|i|u|strong|em|br)\b[^>]*>/i.test(note);
}
