export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'promise';

export type NotificationStatus = 'pending' | 'resolved' | 'rejected';

export type Notification = {
	id: string;
	type: NotificationType;
	message: string;
	duration: number;
	timestamp: number;
	read: boolean;
	promise?: {
		status: NotificationStatus;
		loadingMessage?: string;
		successMessage?: string;
		errorMessage?: string;
	};
};

// Legacy type for backwards compatibility
export type Toast = Notification;
