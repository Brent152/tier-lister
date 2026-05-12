import { useEffect } from "react";
import { useStore } from "../store";

const AUTO_DISMISS_MS = 6000;

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} message={t.message} />
      ))}
    </div>
  );
}

function ToastItem({ id, message }: { id: string; message: string }) {
  const dismiss = useStore((s) => s.dismissToast);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);
  return (
    <div className="bg-red-900/90 border border-red-700 text-red-100 px-4 py-2 rounded shadow-lg max-w-md text-sm flex items-start gap-3">
      <span className="flex-1">{message}</span>
      <button onClick={() => dismiss(id)} className="text-red-300 hover:text-white">
        ×
      </button>
    </div>
  );
}
