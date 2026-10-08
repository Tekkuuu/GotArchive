/**
 * Formats thrown value to user message.
 * @param e - Caught value.
 * @param fallback - Default message.
 * @returns Message.
 */
export function errorMessage(e: unknown, fallback: string): string {
	if (e && typeof e === 'object') {
		const err = e as { body?: { message?: string }; message?: string };
		return err.body?.message ?? err.message ?? fallback;
	}
	return fallback;
}
