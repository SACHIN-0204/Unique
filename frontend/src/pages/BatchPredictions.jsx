import { useEffect, useState } from 'react';
import { getBatchPredict } from '../api';

const urgencyStyle = {
  CRITICAL:   'bg-red-100 text-red-700 border-red-300',
  HIGH:       'bg-orange-100 text-orange-700 border-orange-300',
  ORDER:      'bg-yellow-100 text-yellow-700 border-yellow-300',
  SUFFICIENT: 'bg-green-100 text-green-700 border-green-300',
  UNKNOWN:    'bg-gray-100 text-gray-500 border-gray-200',
};

const urgencyIcon = {
  CRITICAL:   '🔴',
  HIGH:       '🟠',
  ORDER:      '🟡',
  SUFFICIENT: '🟢',
  UNKNOWN:    '⚪',
};

export default function BatchPredictions() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(7);

  const load = (d) => {
    setLoading(true);
    getBatchPredict(d)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(days); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          📦 Batch Prediction Report
        </h1>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={days}
            onChange={e => { setDays(+e.target.value); load(+e.target.value); }}>
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
          </select>
          <button
            onClick={() => load(days)}
            className="bg-green-700 text-white px-4 py-2 text-sm rounded-lg hover:bg-green-800">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Running ML forecasts for all products...
        </div>
      ) : data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Critical',   key: 'critical',   color: 'text-red-600'    },
              { label: 'High',       key: 'high',       color: 'text-orange-600' },
              { label: 'Order',      key: 'order',      color: 'text-yellow-600' },
              { label: 'Sufficient', key: 'sufficient', color: 'text-green-600'  },
            ].map(({ label, key, color }) => (
              <div key={key} className="bg-white rounded-xl p-4 shadow text-center">
                <p className={`text-3xl font-bold ${color}`}>{data.summary[key]}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mb-3">
            Generated: {new Date(data.generatedAt).toLocaleString()} ·
            Forecast window: {data.forecastDays} days
          </p>

          {/* Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.map(p => (
              <div key={p.productId}
                className={`rounded-xl border p-4 shadow-sm ${urgencyStyle[p.urgency]}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{p.productName}</h3>
                  <span className="text-xl">{urgencyIcon[p.urgency]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="opacity-60">Current Stock</p>
                    <p className="font-semibold">{p.currentStock} {p.unit}</p>
                  </div>
                  <div>
                    <p className="opacity-60">{data.forecastDays}-Day Demand</p>
                    <p className="font-semibold">{p.totalPredictedDemand} {p.unit}</p>
                  </div>
                  <div>
                    <p className="opacity-60">Order Qty</p>
                    <p className="font-bold text-base">
                      {p.suggestedOrderQty > 0 ? `${p.suggestedOrderQty} ${p.unit}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="opacity-60">Urgency</p>
                    <p className="font-bold">{p.urgency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}