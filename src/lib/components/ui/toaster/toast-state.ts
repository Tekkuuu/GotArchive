import { writable, type Writable } from 'svelte/store';
import type { Toast } from './types';

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

  function success(message: string, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      duration,
      type: 'success'
    });
  }

  function error(message: string, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      duration,
      type: 'error'
    });
  }

  function warning(message: string, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      duration,
      type: 'warning'
    });
  }

  function info(message: string, duration = 2000) {
    add({
      id: crypto.randomUUID(),
      message,
      duration,
      type: 'info'
    });
  }

  function promise(promise: Promise<any>, message: string = "Loading", duration = 2000) {
    const id = crypto.randomUUID();
    add(
      {
        id,
        message: message,
        duration,
        type: 'promise',
        promise
      },
      true // infinite
    );

    promise
      .then(() => {
        update(toasts =>
          toasts.map(t => (t.id === id ? { ...t, type: "success", message: 'Success' } : t))
        );
      })
      .catch(err => {
        update(toasts =>
          toasts.map(t =>
            t.id === id ? { ...t, type: "error", message: err.message || 'Failed' } : t
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
