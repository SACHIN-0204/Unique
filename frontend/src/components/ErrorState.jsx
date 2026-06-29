import { AlertTriangle, RefreshCw, WifiOff, Database } from 'lucide-react';

const configs = {
  network: {
    icon: WifiOff,
    title: 'Connection Failed',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
  },
  data: {
    icon: Database,
    title: 'No Data Found',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 border-yellow-200',
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
  },
};

export default function ErrorState({
  message = 'An unexpected error occurred.',
  type = 'generic',
  onRetry,
}) {
  const { icon: Icon, title, color, bg } = configs[type] || configs.generic;

  return (
    <div className={`rounded-2xl border p-8 text-center ${bg} animate-fade-in`}>
      <Icon className={`mx-auto mb-3 ${color}`} size={36} />
      <h3 className="font-bold text-gray-800 text-lg mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="btn-ghost flex items-center gap-2 mx-auto text-sm">
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
}