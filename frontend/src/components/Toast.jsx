import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: { Icon: CheckCircle, cls: 'text-green-500', bar: 'bg-green-500',
             bg: 'bg-white border-green-200' },
  error:   { Icon: XCircle,     cls: 'text-red-500',   bar: 'bg-red-500',
             bg: 'bg-white border-red-200' },
  warning: { Icon: AlertTriangle, cls: 'text-yellow-500', bar: 'bg-yellow-500',
             bg: 'bg-white border-yellow-200' },
  info:    { Icon: Info,        cls: 'text-blue-500',  bar: 'bg-blue-500',
             bg: 'bg-white border-blue-200' },
};

function Toast({ id, type = 'info', message, duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true);
  const { Icon, cls, bar, bg } = icons[type] || icons.info;

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`relative flex items-start gap-3 w-80 rounded-2xl border
      shadow-lift px-4 py-3 overflow-hidden transition-all duration-300
      ${bg} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-1 ${bar} rounded-b-2xl`}
        style={{
          animation: `shrink ${duration}ms linear forwards`,
        }} />

      <Icon className={`mt-0.5 shrink-0 ${cls}`} size={18} />
      <p className="text-sm text-gray-700 flex-1 font-medium">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(() => onClose(id), 300); }}
        className="text-gray-300 hover:text-gray-500 transition shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Toast Container ────────────────────────────────────────
let _addToast = null;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  _addToast = (toast) => {
    const id = Date.now();
    setToasts(t => [...t, { ...toast, id }]);
  };

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      {toasts.map(t => (
        <Toast key={t.id} {...t} onClose={remove} />
      ))}
    </div>
  );
}

// ── Toast API (call anywhere) ──────────────────────────────
export const toast = {
  success: (message, duration) => _addToast?.({ type: 'success', message, duration }),
  error:   (message, duration) => _addToast?.({ type: 'error',   message, duration }),
  warning: (message, duration) => _addToast?.({ type: 'warning', message, duration }),
  info:    (message, duration) => _addToast?.({ type: 'info',    message, duration }),
};