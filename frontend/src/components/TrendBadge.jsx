export default function TrendBadge({ trend }) {
  if (!trend) return null;

  const map = {
    RISING:  { icon: '📈', label: 'Demand Rising',  cls: 'bg-red-100 text-red-700' },
    FALLING: { icon: '📉', label: 'Demand Falling', cls: 'bg-blue-100 text-blue-700' },
    STABLE:  { icon: '➡️', label: 'Demand Stable',  cls: 'bg-gray-100 text-gray-700' },
  };

  const { icon, label, cls } = map[trend] || map.STABLE;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {icon} {label}
    </span>
  );
}