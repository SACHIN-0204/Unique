import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getProducts, getSales, getPrediction } from '../api';
import PredictionChart from '../components/PredictionChart';
import AccuracyBadge from '../components/AccuracyBadge';
import TrendBadge from '../components/TrendBadge';

export default function Predictions() {
  const { state }           = useLocation();
  const [products, setProducts]   = useState([]);
  const [selected, setSelected]   = useState(state?.product || null);
  const [sales, setSales]         = useState([]);
  const [forecast, setForecast]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    getProducts().then(res => {
      setProducts(res.data);
      if (!selected && res.data.length) setSelected(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true); setError(''); setForecast(null);

    Promise.all([
      getSales(selected._id, 90),
      getPrediction(selected._id, 7)
    ])
    .then(([salesRes, predRes]) => {
      setSales(salesRes.data);
      setForecast(predRes.data);
    })
    .catch(err => setError(err.response?.data?.error || 'Prediction failed'))
    .finally(() => setLoading(false));
  }, [selected]);

  const isLow = selected?.stockStatus === 'LOW';
  const totalDemand = forecast?.totalPredictedDemand || 0;
  const needsReorder = totalDemand > (selected?.currentStock || 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🔮 Demand Predictions</h1>

      {/* Product Selector */}
      <div className="bg-white rounded-xl p-4 shadow mb-6">
        <label className="text-sm font-medium text-gray-600 block mb-2">
          Select Product
        </label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={selected?._id || ''}
          onChange={e => {
            const p = products.find(x => x._id === e.target.value);
            setSelected(p);
          }}>
          {products.map(p => (
            <option key={p._id} value={p._id}>{p.name} ({p.stockStatus})</option>
          ))}
        </select>
      </div>

      {/* Stock + Forecast Summary */}
      {selected && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-xs text-gray-500">Current Stock</p>
            <p className="text-xl font-bold text-gray-800">
              {selected.currentStock} {selected.unit}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-xs text-gray-500">7-Day Demand</p>
            <p className="text-xl font-bold text-orange-600">
              {totalDemand} {selected.unit}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-xs text-gray-500">Stock Status</p>
            <p className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
              {isLow ? '⚠ LOW' : '✓ OK'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-xs text-gray-500">Action</p>
            <p className={`text-sm font-bold ${needsReorder ? 'text-red-600' : 'text-green-600'}`}>
              {needsReorder ? '🛒 Reorder Now' : '✓ Sufficient'}
            </p>
          </div>
        </div>
      )}

      {forecast && (
      <div className="flex items-center gap-3 mb-4">
      <TrendBadge trend={forecast.trend} />
      <span className="text-sm text-gray-500">
      Avg daily sales: <strong>{forecast.modelInfo?.avgDailySales} {selected?.unit}</strong>
      </span>
      </div>
      )}

      {/* Chart */}
      {loading && (
        <div className="text-center py-16 text-gray-500">
          Running Prophet forecast model...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          ❌ {error}
        </div>
      )}
      {!loading && forecast && sales.length > 0 && (
        <PredictionChart salesData={sales} forecastData={forecast.forecast} />
      )}

      {/* // After the PredictionChart, add: */}
      {forecast?.accuracy && (
      <div className="mt-6">
       <AccuracyBadge accuracy={forecast.accuracy} />
      </div>
      )}

      {/* Forecast Table */}
      {forecast && (
        <div className="bg-white rounded-xl p-4 shadow mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">📅 Day-by-Day Forecast</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">Date</th>
                <th className="text-right p-2">Predicted Qty</th>
                <th className="text-right p-2">Min</th>
                <th className="text-right p-2">Max</th>
              </tr>
            </thead>
            <tbody>
              {forecast.forecast.map((f, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{f.date}</td>
                  <td className="p-2 text-right font-semibold text-orange-600">
                    {f.predictedQty} {selected?.unit}
                  </td>
                  <td className="p-2 text-right text-gray-400">{f.lower}</td>
                  <td className="p-2 text-right text-gray-400">{f.upper}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-orange-50">
                <td className="p-2 font-bold">Total 7-Day Demand</td>
                <td className="p-2 text-right font-bold text-orange-700" colSpan={3}>
                  {totalDemand} {selected?.unit}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}