import { describe, it, expect } from 'vitest';
import { errorMessage } from './format';

describe('errorMessage', () => {
	it('prefers a SvelteKit fail()/error() body message', () => {
		expect(errorMessage({ body: { message: 'body msg' }, message: 'plain msg' }, 'fallback')).toBe(
			'body msg'
		);
	});

	it('falls back to a top-level message', () => {
		expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom');
	});

	it('uses the fallback for unknown shapes', () => {
		expect(errorMessage('just a string', 'fallback')).toBe('fallback');
		expect(errorMessage(null, 'fallback')).toBe('fallback');
		expect(errorMessage(undefined, 'fallback')).toBe('fallback');
		expect(errorMessage({}, 'fallback')).toBe('fallback');
	});

	it('uses an empty body message over the fallback if present', () => {
		expect(errorMessage({ body: { message: '' } }, 'fallback')).toBe('');
	});
});
