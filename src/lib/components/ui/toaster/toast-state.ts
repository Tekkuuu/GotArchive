import { writable, type Writable } from 'svelte/store';
import type { Toast } from './types';
import type { Icon } from 'lucide-svelte';

type ToastList = Toast[];

function createToaster() {
  const { subscribe, update, set }: Writable<ToastList> = writable([]);
  const toastTimeouts = new Map<string, NodeJS.Timeout>();

  function add(toast: Toast, infinite = false) {
    update(toasts => [...toasts, toast]);
    if (!infinite) {
      toastTimeouts.set(
        toast.id,
        setTimeout(() => remove(toast.id), toast.duration)
      );
    }
  }

  function remove(id: string) {
    update(toasts => toasts.filter(toast => toast.id !== id));
    const timeout = toastTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.delete(id);
    }
  }

  function removeAll() {
    set([]);
    for (const timeout of toastTimeouts.values()) {
      clearTimeout(timeout);
    }
    toastTimeouts.clear();
  }

  function success(message: string, icon?: typeof Icon, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      icon,
      duration,
      type: 'success'
    });
  }

  function error(message: string, icon?: typeof Icon, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      icon,
      duration,
      type: 'error'
    });
  }

  function warning(message: string, icon?: typeof Icon, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      icon,
      duration,
      type: 'warning'
    });
  }

  function info(message: string, icon?: typeof Icon, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      icon,
      duration,
      type: 'info'
    });
  }

  function promise(promise: Promise<any>, icon?: typeof Icon, duration = 2000) {
    const id = crypto.randomUUID();
    add(
      {
        id,
        message: 'Loading',
        duration,
        icon,
        type: 'promise',
        promise
      },
      true // infinite
    );

    promise
      .then(() => {
        update(toasts =>
          toasts.map(t => (t.id === id ? { ...t, message: 'Success' } : t))
        );
      })
      .catch(err => {
        update(toasts =>
          toasts.map(t =>
            t.id === id ? { ...t, message: err.message || 'Failed' } : t
          )
        );
      })
      .finally(() => {
        toastTimeouts.set(
          id,
          setTimeout(() => remove(id), duration)
        );
      });
  }

  return {
    subscribe,
    add,
    remove,
    removeAll,
    success,
    error,
    warning,
    info,
    promise
  };
}

export const toaster = createToaster();
