import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { notificationState } from './notification-state.svelte';

describe('notificationState', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		notificationState.deleteAll();
	});

	afterEach(() => {
		notificationState.deleteAll();
		vi.useRealTimers();
	});

	it('shows a popup and auto-dismisses it after its duration', () => {
		notificationState.success('Saved');

		expect(notificationState.popupNotifications).toHaveLength(1);
		vi.advanceTimersByTime(3000);
		expect(notificationState.popupNotifications).toHaveLength(0);
	});

	it('reactively notifies subscribers when a popup auto-dismisses', () => {
		let observed = 0;
		const cleanup = $effect.root(() => {
			$effect(() => {
				observed = notificationState.popupNotifications.length;
			});
		});
		flushSync();

		notificationState.success('Saved');
		flushSync();
		expect(observed).toBe(1);

		vi.advanceTimersByTime(3000);
		flushSync();
		expect(observed).toBe(0);

		cleanup();
	});

	it('pauses and resumes the dismiss timer around hover', () => {
		notificationState.success('Saved');
		const id = notificationState.notifications[0].id;

		vi.advanceTimersByTime(1000);
		notificationState.pauseDismiss(id);

		// Still paused well past the original duration.
		vi.advanceTimersByTime(5000);
		expect(notificationState.popupNotifications).toHaveLength(1);

		// Resume consumes only the remaining ~2000ms.
		notificationState.resumeDismiss(id);
		vi.advanceTimersByTime(1999);
		expect(notificationState.popupNotifications).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(notificationState.popupNotifications).toHaveLength(0);
	});

	it('only consumes the remaining time when paused for a long while', () => {
		notificationState.success('Saved', 500);
		const id = notificationState.notifications[0].id;

		vi.advanceTimersByTime(200);
		notificationState.pauseDismiss(id);

		// Time spent paused does not count against the remaining ~300ms.
		vi.advanceTimersByTime(10_000);
		notificationState.resumeDismiss(id);

		vi.advanceTimersByTime(299);
		expect(notificationState.popupNotifications).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(notificationState.popupNotifications).toHaveLength(0);
	});

	it('keeps a pending promise popup visible until it settles', async () => {
		let resolve!: () => void;
		const pending = new Promise<void>((r) => {
			resolve = r;
		});

		notificationState.promise(pending, { successMessage: 'Done', duration: 1000 });
		expect(notificationState.popupNotifications).toHaveLength(1);

		// Pending promise is not dismissed by time alone.
		vi.advanceTimersByTime(10_000);
		expect(notificationState.popupNotifications).toHaveLength(1);

		resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect(notificationState.notifications[0]).toMatchObject({
			type: 'success',
			message: 'Done'
		});

		vi.advanceTimersByTime(1000);
		expect(notificationState.popupNotifications).toHaveLength(0);
	});

	it('marks a manually dismissed popup as read', () => {
		notificationState.success('Saved');
		const id = notificationState.notifications[0].id;

		notificationState.dismiss(id);

		expect(notificationState.popupNotifications).toHaveLength(0);
		expect(notificationState.notifications[0].read).toBe(true);
		expect(notificationState.unreadCount).toBe(0);
	});

	it('does not mark notifications read when the center is toggled', () => {
		notificationState.success('Saved');

		notificationState.toggleDrawer();

		expect(notificationState.isDrawerOpen).toBe(true);
		expect(notificationState.unreadCount).toBe(1);
	});
});
