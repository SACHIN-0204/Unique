// import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StockCard({ product, onClick }) {
  const isLow     = product.stockStatus === 'LOW';
  const stockPct  = Math.min(100,
    (product.currentStock / (product.minThreshold * 3)) * 100
  );

  return (
    <div onClick={() => onClick(product)}
      className={`cursor-pointer rounded-2xl p-4 border-l-4 shadow-card
        hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200
        animate-fade-in
        ${isLow
          ? 'border-red-400 bg-red-50 hover:bg-red-100/50'
          : 'border-green-500 bg-white hover:bg-green-50/30'}`}>

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-800">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
        </div>
        <span className={`badge text-xs
          ${isLow
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'}`}>
          {isLow ? '⚠ LOW' : '✓ OK'}
        </span>
      </div>

      {/* Stock Info */}
      <div className="flex justify-between text-sm mb-3">
        <div>
          <p className="text-gray-400 text-xs">Current</p>
          <p className="font-bold text-gray-800">
            {product.currentStock} <span className="text-xs font-normal text-gray-400">
              {product.unit}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Min Level</p>
          <p className="font-semibold text-gray-600">
            {product.minThreshold} <span className="text-xs font-normal text-gray-400">
              {product.unit}
            </span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-500
            ${stockPct < 33 ? 'bg-red-500' :
              stockPct < 66 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${stockPct}%` }} />
      </div>

      <p className="text-xs text-gray-400 text-right">
        {stockPct.toFixed(0)}% of safe level · click to predict →
      </p>
    </div>
  );
}