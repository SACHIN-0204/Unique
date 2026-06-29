import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../api';
import StockCard from '../components/StockCards';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { SkeletonCard, SkeletonKPI } from '../components/Skeleton';
import { AlertTriangle, CheckCircle, Package } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true); setError('');
    getProducts()
      .then(res => setProducts(res.data))
      .catch(() => setError('Could not connect to the server. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const lowStock = products.filter(p => p.stockStatus === 'LOW');
  const okStock  = products.filter(p => p.stockStatus === 'SUFFICIENT');

  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Stock Dashboard</h1>
        <span className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <SkeletonKPI count={3} />
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Products', value: products.length,
              icon: Package, color: 'text-blue-500' },
            { label: 'Low Stock Items', value: lowStock.length,
              icon: AlertTriangle, color: 'text-red-500' },
            { label: 'Sufficient Stock', value: okStock.length,
              icon: CheckCircle, color: 'text-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon className={`mx-auto mb-2 ${color}`} size={28} />
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorState type="network" message={error} onRetry={load} />
      )}

      {/* Low Stock Alert Banner */}
      {!loading && !error && lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6
          animate-fade-in flex flex-col sm:flex-row sm:items-center
          justify-between gap-3">
          <div>
            <h2 className="text-red-700 font-bold">⚠️ Reorder Needed</h2>
            <p className="text-red-500 text-sm mt-0.5">
              {lowStock.map(p => p.name).join(', ')} — below minimum threshold
            </p>
          </div>
          <button onClick={() => navigate('/reorder')}
            className="btn-primary text-sm whitespace-nowrap">
            View Reorder Report →
          </button>
        </div>
      )}

      {/* Stock Grids */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !error && (
        <>
          {lowStock.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-red-600 mb-3">
                ⚠ Needs Reorder
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {lowStock.map(p => (
                  <StockCard key={p._id} product={p}
                    onClick={() => navigate('/predictions',
                      { state: { product: p } })} />
                ))}
              </div>
            </>
          )}

          <h2 className="text-base font-semibold text-green-700 mb-3">
            ✓ Sufficient Stock
          </h2>
          {okStock.length === 0 ? (
            <EmptyState icon="📦"
              title="No Sufficient Stock Items"
              message="All products need attention!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {okStock.map(p => (
                <StockCard key={p._id} product={p}
                  onClick={() => navigate('/predictions',
                    { state: { product: p } })} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}