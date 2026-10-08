import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';
import type { Notification, NotificationType } from './types';

const STORAGE_KEY = 'gotarchive_notifications';
const MAX_NOTIFICATIONS = 100;
const DEFAULT_DURATION = 3000;

interface PopupTimer {
	handle: ReturnType<typeof setTimeout> | null;
	remaining: number;
	startedAt: number;
}

class NotificationState {
	notifications = $state<Notification[]>([]);
	isDrawerOpen = $state(false);

	/** IDs of notifications currently shown as popups. */
	activePopups = new SvelteSet<string>();

	private popupTimers = new Map<string, PopupTimer>();

	constructor() {
		if (browser) {
			this.loadFromStorage();
		}
	}

	private loadFromStorage() {
		if (typeof localStorage === 'undefined') return;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				this.notifications = JSON.parse(stored);
			}
		} catch (error) {
			console.error('Failed to load notifications from storage', { error: String(error) });
		}
	}

	private saveToStorage() {
		if (!browser || typeof localStorage === 'undefined') return;

		try {
			// Keep only the most recent entries
			const toSave = this.notifications.slice(-MAX_NOTIFICATIONS);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
		} catch (error) {
			console.error('Failed to save notifications to storage', { error: String(error) });
		}
	}

	private createNotification(
		type: NotificationType,
		message: string,
		duration: number = DEFAULT_DURATION
	): Notification {
		return {
			id: crypto.randomUUID(),
			type,
			message,
			duration,
			timestamp: Date.now(),
			read: false
		};
	}

	private add(notification: Notification, autoDismiss = true) {
		this.notifications = [...this.notifications, notification];
		this.saveToStorage();

		this.activePopups.add(notification.id);
		if (autoDismiss) {
			this.scheduleDismiss(notification.id, notification.duration);
		}
	}

	private scheduleDismiss(id: string, duration: number) {
		if (duration <= 0) return;

		this.clearDismiss(id);
		const entry: PopupTimer = { handle: null, remaining: duration, startedAt: Date.now() };
		entry.handle = setTimeout(() => this.dismissPopup(id), duration);
		this.popupTimers.set(id, entry);
	}

	private clearDismiss(id: string) {
		const entry = this.popupTimers.get(id);
		if (entry?.handle) clearTimeout(entry.handle);
		this.popupTimers.delete(id);
	}

	private clearAllDismissTimers() {
		for (const entry of this.popupTimers.values()) {
			if (entry.handle) clearTimeout(entry.handle);
		}
		this.popupTimers.clear();
	}

	/** Hides a popup without marking it read. */
	private dismissPopup(id: string) {
		this.clearDismiss(id);
		this.activePopups.delete(id);
	}

	pauseDismiss(id: string) {
		const entry = this.popupTimers.get(id);
		if (!entry || !entry.handle) return;

		clearTimeout(entry.handle);
		entry.handle = null;
		entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
	}

	/** Resumes a paused auto-dismiss timer. */
	resumeDismiss(id: string) {
		const entry = this.popupTimers.get(id);
		if (!entry || entry.handle) return;

		if (entry.remaining <= 0) {
			this.dismissPopup(id);
			return;
		}

		entry.startedAt = Date.now();
		entry.handle = setTimeout(() => this.dismissPopup(id), entry.remaining);
	}

	/** Dismisses a popup and marks it read. */
	dismiss(id: string) {
		this.dismissPopup(id);
		this.markAsRead(id);
	}

	success(message: string, duration?: number) {
		const notification = this.createNotification('success', message, duration);
		this.add(notification);
	}

	error(message: string, duration?: number) {
		const notification = this.createNotification('error', message, duration);
		this.add(notification);
	}

	warning(message: string, duration?: number) {
		const notification = this.createNotification('warning', message, duration);
		this.add(notification);
	}

	info(message: string, duration?: number) {
		const notification = this.createNotification('info', message, duration);
		this.add(notification);
	}

	promise(
		promise: Promise<unknown>,
		options: {
			loadingMessage?: string;
			successMessage?: string;
			errorMessage?: string;
			duration?: number;
		} = {}
	) {
		const {
			loadingMessage = 'Loading...',
			successMessage = 'Success',
			errorMessage = 'Failed',
			duration = DEFAULT_DURATION
		} = options;

		const notification: Notification = {
			id: crypto.randomUUID(),
			type: 'promise',
			message: loadingMessage,
			duration,
			timestamp: Date.now(),
			read: false,
			promise: {
				status: 'pending',
				loadingMessage,
				successMessage,
				errorMessage
			}
		};

		// Pending promises stay visible; the dismiss timer only starts once settled.
		this.add(notification, false);

		promise
			.then(() => {
				const index = this.notifications.findIndex((n) => n.id === notification.id);
				if (index !== -1) {
					this.notifications[index] = {
						...this.notifications[index],
						type: 'success',
						message: successMessage,
						promise: {
							...this.notifications[index].promise!,
							status: 'resolved'
						}
					};
					this.saveToStorage();
					this.scheduleDismiss(notification.id, duration);
				}
			})
			.catch((err) => {
				const index = this.notifications.findIndex((n) => n.id === notification.id);
				if (index !== -1) {
					this.notifications[index] = {
						...this.notifications[index],
						type: 'error',
						message: err?.message || errorMessage,
						promise: {
							...this.notifications[index].promise!,
							status: 'rejected'
						}
					};
					this.saveToStorage();
					this.scheduleDismiss(notification.id, duration);
				}
			});
	}

	markAsRead(id: string) {
		const index = this.notifications.findIndex((n) => n.id === id);
		if (index === -1 || this.notifications[index].read) return;
		this.notifications[index] = { ...this.notifications[index], read: true };
		this.saveToStorage();
	}

	markAllAsRead() {
		this.notifications = this.notifications.map((n) => (n.read ? n : { ...n, read: true }));
		this.saveToStorage();
	}

	delete(id: string) {
		this.clearDismiss(id);
		this.activePopups.delete(id);
		this.notifications = this.notifications.filter((n) => n.id !== id);
		this.saveToStorage();
	}

	deleteAll() {
		this.clearAllDismissTimers();
		this.notifications = [];
		this.activePopups.clear();
		this.saveToStorage();
	}

	toggleDrawer() {
		this.isDrawerOpen = !this.isDrawerOpen;
	}

	openDrawer() {
		this.isDrawerOpen = true;
	}

	closeDrawer() {
		this.isDrawerOpen = false;
	}

	get unreadCount() {
		return this.notifications.filter((n) => !n.read).length;
	}

	get popupNotifications() {
		return this.notifications.filter((n) => this.activePopups.has(n.id));
	}
}

export const notificationState = new NotificationState();
