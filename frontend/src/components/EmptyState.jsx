export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-bold text-gray-700 text-lg mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-5">{message}</p>
      {action}
    </div>
  );
}