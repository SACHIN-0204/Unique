export default function AccuracyBadge({ accuracy }) {
  if (!accuracy) return null;

  const pct = accuracy.accuracy_pct;
  const color =
    pct >= 85 ? 'green' :
    pct >= 70 ? 'yellow' :
                'red';

  const colorMap = {
    green:  'bg-green-100 text-green-700 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    red:    'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <h4 className="font-bold text-sm mb-2">🎯 Model Accuracy (7-day holdout test)</h4>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold">{pct}%</p>
          <p className="text-xs">Accuracy</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{accuracy.mae}</p>
          <p className="text-xs">MAE</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{accuracy.rmse}</p>
          <p className="text-xs">RMSE</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{accuracy.mape}%</p>
          <p className="text-xs">MAPE</p>
        </div>
      </div>
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            color === 'green'  ? 'bg-green-500'  :
            color === 'yellow' ? 'bg-yellow-500' :
                                  'bg-red-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}