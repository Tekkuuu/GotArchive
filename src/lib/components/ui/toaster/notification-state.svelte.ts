import { browser } from '$app/environment';
import type { Notification, NotificationType } from './types';
import { logError } from '$lib/client/logger';

const STORAGE_KEY = 'gotarchive_notifications';
const MAX_NOTIFICATIONS = 100;

class NotificationState {
	notifications = $state<Notification[]>([]);
	isDrawerOpen = $state(false);
	activePopups = $state<Set<string>>(new Set());

	constructor() {
		if (browser) {
			this.loadFromStorage();
		}
	}

	private loadFromStorage() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				this.notifications = JSON.parse(stored);
			}
		} catch (error) {
			logError('Failed to load notifications from storage', { error: String(error) });
		}
	}

	private saveToStorage() {
		if (!browser) return;

		try {
			// Keep only the most recent MAX_NOTIFICATIONS
			const toSave = this.notifications.slice(-MAX_NOTIFICATIONS);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
		} catch (error) {
			logError('Failed to save notifications to storage', { error: String(error) });
		}
	}

	private createNotification(
		type: NotificationType,
		message: string,
		duration: number = 3000
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

	private add(notification: Notification) {
		this.notifications = [...this.notifications, notification];
		this.saveToStorage();

		// Add to active popups
		this.activePopups.add(notification.id);

		// Auto-remove from popups after duration
		setTimeout(() => {
			this.activePopups.delete(notification.id);
		}, notification.duration);
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
			duration = 3000
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

		this.add(notification);

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

					// Auto-dismiss after duration
					setTimeout(() => {
						this.activePopups.delete(notification.id);
					}, duration);
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

					// Auto-dismiss after duration
					setTimeout(() => {
						this.activePopups.delete(notification.id);
					}, duration);
				}
			});
	}

	markAsRead(id: string) {
		const index = this.notifications.findIndex((n) => n.id === id);
		if (index !== -1) {
			this.notifications[index] = { ...this.notifications[index], read: true };
			this.saveToStorage();
		}
	}

	markAllAsRead() {
		this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
		this.saveToStorage();
	}

	delete(id: string) {
		this.notifications = this.notifications.filter((n) => n.id !== id);
		this.activePopups.delete(id);
		this.saveToStorage();
	}

	deleteAll() {
		this.notifications = [];
		this.activePopups.clear();
		this.saveToStorage();
	}

	toggleDrawer() {
		this.isDrawerOpen = !this.isDrawerOpen;
		if (this.isDrawerOpen) {
			// Mark all as read when opening drawer
			this.markAllAsRead();
		}
	}

	openDrawer() {
		this.isDrawerOpen = true;
		this.markAllAsRead();
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
