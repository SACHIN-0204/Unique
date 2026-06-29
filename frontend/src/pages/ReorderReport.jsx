import { useEffect, useState } from 'react';
import { getProducts, getPrediction } from '../api';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '../components/Toast';

const urgencyConfig = {
  CRITICAL:   { bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',    icon: '🔴', label: 'Critical'   },
  HIGH:       { bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', icon: '🟠', label: 'High'    },
  ORDER:      { bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', icon: '🟡', label: 'Order'   },
  SUFFICIENT: { bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700', icon: '🟢', label: 'OK'        },
  NO_DATA:    { bg: 'bg-gray-50',   badge: 'bg-gray-100 text-gray-500',   icon: '⚪', label: 'No Data'   },
};

export default function ReorderReport() {
  const [report, setReport]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(7);
  const [filter, setFilter]   = useState('ALL');

  const load = async (d) => {
    setLoading(true);
    try {
      const res = await getProducts();
      const rows = await Promise.all(res.data.map(async p => {
        try {
          const pred    = await getPrediction(p._id, d);
          const demand  = pred.data.totalPredictedDemand;
          const gap     = demand - p.currentStock;
          const daysLeft = demand > 0
            ? (p.currentStock / (demand / d)).toFixed(1)
            : '∞';

          const urgency =
            parseFloat(daysLeft) <= 1     ? 'CRITICAL' :
            parseFloat(daysLeft) <= d / 2 ? 'HIGH'     :
            gap > 0                        ? 'ORDER'    :
                                             'SUFFICIENT';

          return {
            ...p,
            predictedDemand:  demand,
            suggestedOrder:   Math.max(0, Math.ceil(gap + p.minThreshold)),
            daysLeft,
            urgency,
            trend: pred.data.trend,
          };
        } catch {
          return { ...p, urgency: 'NO_DATA', predictedDemand: 0,
                   suggestedOrder: 0, daysLeft: '—' };
        }
      }));

      const order = { CRITICAL: 0, HIGH: 1, ORDER: 2, SUFFICIENT: 3, NO_DATA: 4 };
      rows.sort((a, b) => (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4));
      setReport(rows);
      const criticalCount = rows.filter(r => r.urgency === 'CRITICAL').length;
      if (criticalCount > 0) {
       toast.warning(`🔴 ${criticalCount} product(s) in CRITICAL stock!`, 5000);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(days); }, []);

  const filtered = filter === 'ALL'
    ? report
    : report.filter(r => r.urgency === filter);

  // CSV export
  const exportCSV = () => {
    const headers = ['Product', 'Category', 'Current Stock', 'Unit',
                     `${days}-Day Demand`, 'Suggested Order', 'Days Left', 'Urgency'];
    const rows = report.map(r => [
      r.name, r.category, r.currentStock, r.unit,
      r.predictedDemand, r.suggestedOrder, r.daysLeft, r.urgency
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `reorder-report-${days}days.csv`; a.click();
  };

  const summary = {
    critical:   report.filter(r => r.urgency === 'CRITICAL').length,
    high:       report.filter(r => r.urgency === 'HIGH').length,
    order:      report.filter(r => r.urgency === 'ORDER').length,
    sufficient: report.filter(r => r.urgency === 'SUFFICIENT').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛒 Reorder Report</h1>
        <div className="flex gap-2 flex-wrap">
          <select className="border rounded-lg px-3 py-2 text-sm"
            value={days}
            onChange={e => { setDays(+e.target.value); load(+e.target.value); }}>
            <option value={7}>7-day forecast</option>
            <option value={14}>14-day forecast</option>
            <option value={30}>30-day forecast</option>
          </select>
          <button onClick={() => load(days)}
            className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm
              hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1 bg-green-700 text-white px-3 py-2
              rounded-lg text-sm hover:bg-green-800">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'critical',   label: 'Critical',   color: 'text-red-600'    },
          { key: 'high',       label: 'High',       color: 'text-orange-600' },
          { key: 'order',      label: 'To Order',   color: 'text-yellow-600' },
          { key: 'sufficient', label: 'Sufficient', color: 'text-green-600'  },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-xl p-4 shadow text-center
            cursor-pointer hover:shadow-md transition"
            onClick={() => setFilter(filter === key.toUpperCase() ? 'ALL' : key.toUpperCase())}>
            <p className={`text-3xl font-bold ${color}`}>{summary[key]}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL', 'CRITICAL', 'HIGH', 'ORDER', 'SUFFICIENT'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition
              ${filter === f
                ? 'bg-green-700 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Calculating predictions...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-right p-3">{days}d Demand</th>
                <th className="text-right p-3">Days Left</th>
                <th className="text-right p-3">Order Qty</th>
                <th className="text-center p-3">Trend</th>
                <th className="text-center p-3">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const cfg = urgencyConfig[r.urgency] || urgencyConfig.NO_DATA;
                return (
                  <tr key={r._id}
                    className={`border-t ${i % 2 === 0 ? cfg.bg : ''}`}>
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 text-gray-500">{r.category}</td>
                    <td className="p-3 text-right">
                      {r.currentStock} {r.unit}
                    </td>
                    <td className="p-3 text-right font-semibold text-orange-600">
                      {r.predictedDemand} {r.unit}
                    </td>
                    <td className={`p-3 text-right font-bold
                      ${parseFloat(r.daysLeft) <= 2 ? 'text-red-600' :
                        parseFloat(r.daysLeft) <= 4 ? 'text-orange-600' :
                        'text-gray-600'}`}>
                      {r.daysLeft}d
                    </td>
                    <td className="p-3 text-right font-bold text-gray-800">
                      {r.suggestedOrder > 0
                        ? `${r.suggestedOrder} ${r.unit}`
                        : <span className="text-green-600 font-normal">—</span>}
                    </td>
                    <td className="p-3 text-center text-base">
                      {r.trend === 'RISING'  ? '📈' :
                       r.trend === 'FALLING' ? '📉' : '➡️'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No products match this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}