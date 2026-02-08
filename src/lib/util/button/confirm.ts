export function confirm<T>(action: () => T, message: string): T | void {
	if (window.confirm(message)) {
		return action();
	}
}
