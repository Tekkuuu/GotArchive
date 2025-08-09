import type { Icon } from 'lucide-svelte';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'promise';
  message: string;
  icon?: typeof Icon;
  duration: number;
  promise?: Promise<any>;
}
