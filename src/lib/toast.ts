export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();

const notify = () => {
  listeners.forEach((l) => l([...toasts]));
};

export const toast = {
  show: (type: ToastType, title: string, options?: { description?: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 4500;
    const newToast: ToastItem = {
      id,
      type,
      title,
      description: options?.description,
      duration,
    };
    toasts = [newToast, ...toasts].slice(0, 4);
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },

  success: (title: string, options?: { description?: string; duration?: number }) => {
    return toast.show("success", title, options);
  },

  error: (title: string, options?: { description?: string; duration?: number }) => {
    return toast.show("error", title, options);
  },

  info: (title: string, options?: { description?: string; duration?: number }) => {
    return toast.show("info", title, options);
  },

  warning: (title: string, options?: { description?: string; duration?: number }) => {
    return toast.show("warning", title, options);
  },

  dismiss: (id?: string) => {
    if (id) {
      toasts = toasts.filter((t) => t.id !== id);
    } else {
      toasts = [];
    }
    notify();
  },

  subscribe: (listener: ToastListener) => {
    listeners.add(listener);
    listener([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  },
};
