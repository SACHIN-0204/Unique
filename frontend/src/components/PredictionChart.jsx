import {
  ComposedChart, Line, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function PredictionChart({ salesData, forecastData }) {
  // Merge historical + forecast
  const historical = salesData.map(s => ({
    date: s.date.split('T')[0],
    actual: s.quantitySold,
  }));

  const forecast = forecastData.map(f => ({
    date: f.date,
    predicted: f.predictedQty,
    lower: f.lower,
    upper: f.upper,
  }));

  const combined = [...historical.slice(-30), ...forecast]; // last 30 days + forecast

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h3 className="font-semibold text-gray-700 mb-4">
        📈 Sales History + 7-Day Forecast
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={combined}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }}
            tickFormatter={d => d.slice(5)} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="actual" fill="#86efac" name="Actual Sales" radius={[4,4,0,0]} />
          <Line dataKey="predicted" stroke="#f97316" strokeWidth={2}
            dot={{ r: 4 }} name="Predicted" />
          <Area dataKey="upper" fill="#fed7aa" stroke="none"
            name="Upper Bound" opacity={0.4} />
          <Area dataKey="lower" fill="#fff" stroke="none"
            name="Lower Bound" opacity={1} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}