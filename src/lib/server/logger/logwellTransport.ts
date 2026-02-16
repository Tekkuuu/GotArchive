import Transport from 'winston-transport';
import type { Logwell } from 'logwell';

/**
 * Custom Winston transport for Logwell
 * Integrates Winston with Logwell's batching and ingest API
 */
export class LogwellTransport extends Transport {
	private logwell: Logwell;

	constructor(logwell: Logwell, opts?: Transport.TransportStreamOptions) {
		super(opts);
		this.logwell = logwell;
	}

	/**
	 * Winston log method implementation
	 * Maps Winston log levels to Logwell log levels
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	log(info: any, callback: () => void): void {
		setImmediate(() => {
			this.emit('logged', info);
		});

		// Map Winston levels to Logwell levels
		const level = this.mapLogLevel(info.level);
		const message = info.message || '';
		const metadata = this.extractMetadata(info);

		// Send to Logwell
		try {
			this.logwell.log({
				level,
				message,
				metadata,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			this.emit('error', error);
		}

		callback();
	}

	/**
	 * Map Winston log levels to Logwell log levels
	 */
	private mapLogLevel(winstonLevel: string): 'debug' | 'info' | 'warn' | 'error' | 'fatal' {
		switch (winstonLevel) {
			case 'silly':
			case 'verbose':
			case 'debug':
				return 'debug';
			case 'info':
			case 'http':
				return 'info';
			case 'warn':
				return 'warn';
			case 'error':
				return 'error';
			case 'fatal':
			case 'crit':
				return 'fatal';
			default:
				return 'info';
		}
	}

	/**
	 * Extract metadata from Winston log info object
	 * Excludes standard Winston properties
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private extractMetadata(info: any): Record<string, unknown> {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { level, message, timestamp, ...metadata } = info;

		// Remove Winston internal properties
		delete metadata[Symbol.for('level')];
		delete metadata[Symbol.for('message')];
		delete metadata[Symbol.for('splat')];

		return metadata;
	}

	/**
	 * Flush remaining logs before shutdown
	 */
	async close(): Promise<void> {
		try {
			await this.logwell.flush();
		} catch (error) {
			this.emit('error', error);
		}
	}
}
