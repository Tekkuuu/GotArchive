import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: ['span', 'b', 'i', 'u', 'strong', 'em', 'br'],
	allowedAttributes: {
		span: ['style']
	},
	allowedStyles: {
		'*': {
			color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
			'font-size': [/^\d+(?:\.\d+)?rem$/i],
			'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/i],
			'font-style': [/^(normal|italic|oblique)$/i],
			'text-decoration': [
				/^(none|underline|line-through|overline)(\s+(none|underline|line-through|overline))*$/i
			]
		}
	},
	// Disallow raw text/entities that could smuggle markup; keep the rendered text.
	disallowedTagsMode: 'discard',
	allowedSchemes: ['http', 'https', 'mailto']
};

/**
 * Sanitizes staff HTML for {@html}.
 * @param html - Raw DB HTML.
 * @returns Sanitized HTML or null.
 */
export function sanitizeNote(html: string | null | undefined): string | null {
	if (!html) return null;

	const sanitized = sanitizeHtml(html, SANITIZE_OPTIONS).trim();
	return sanitized.length > 0 ? sanitized : null;
}

const SANITIZE_ICON_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: ['svg', 'title', 'path', 'circle', 'rect', 'polygon', 'g'],
	allowedAttributes: {
		// sanitize-html lowercases attribute names, so viewBox is matched as viewbox.
		// The HTML parser re-adjusts it for inline SVG, rendering is unaffected.
		svg: ['viewbox', 'xmlns', 'role', 'aria-hidden', 'width', 'height'],
		path: ['d', 'fill', 'fill-rule', 'clip-rule'],
		circle: ['cx', 'cy', 'r', 'fill'],
		rect: ['x', 'y', 'width', 'height', 'rx', 'fill'],
		polygon: ['points', 'fill'],
		g: ['fill', 'fill-rule', 'clip-rule']
	},
	// No style attributes: brand colour comes from the separate icon_color column.
	disallowedTagsMode: 'discard',
	allowedSchemes: ['http', 'https', 'mailto']
};

/**
 * Sanitizes a platform icon SVG for {@html}.
 *
 * Shape paths without an explicit `fill` get `fill="currentColor"` so the
 * caller's brand colour (via CSS `color`) applies to simple-icons markup,
 * which ships without any fill.
 * @param svg - Raw DB SVG markup.
 * @returns Sanitized SVG or null.
 */
export function sanitizeIconSvg(svg: string | null | undefined): string | null {
	if (!svg) return null;

	const sanitized = sanitizeHtml(svg, SANITIZE_ICON_OPTIONS).trim();
	if (sanitized.length === 0) return null;
	return sanitized.replace(
		/<(path|circle|rect|polygon|g)(?![^>]*\bfill=)/g,
		'<$1 fill="currentColor"'
	);
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Validates a platform brand colour for use in a `style` attribute.
 * @param color - Raw DB colour.
 * @returns Colour or null.
 */
export function sanitizeHexColor(color: string | null | undefined): string | null {
	if (!color) return null;
	return HEX_COLOR_PATTERN.test(color.trim()) ? color.trim() : null;
}
