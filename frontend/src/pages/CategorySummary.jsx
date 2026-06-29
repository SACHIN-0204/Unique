import { useEffect, useState } from 'react';
import { getCategorySummary, getDailySummary } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#16a34a','#f97316','#3b82f6','#a855f7','#ec4899','#eab308'];

export default function CategorySummary() {
  const [categories, setCategories] = useState([]);
  const [dailyData,  setDailyData]  = useState([]);
  const [days, setDays]             = useState(30);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategorySummary(days),
      getDailySummary(days),
    ]).then(([catRes, dailyRes]) => {
      setCategories(catRes.data);

      // Aggregate daily revenue across all products
      const map = {};
      dailyRes.data.forEach(({ _id, totalRevenue }) => {
        const date = _id.date;
        map[date]  = (map[date] || 0) + totalRevenue;
      });
      const sorted = Object.entries(map)
        .map(([date, revenue]) => ({ date: date.slice(5), revenue: +revenue.toFixed(2) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyData(sorted);
    }).finally(() => setLoading(false));
  }, [days]);

  const totalRevenue = categories.reduce((s, c) => s + c.totalRevenue, 0);
  const totalQty     = categories.reduce((s, c) => s + c.totalQty, 0);

  const pieData = categories.map(c => ({
    name:  c._id,
    value: +c.totalRevenue.toFixed(2),
  }));

  const barData = categories.map(c => ({
    category:    c._id,
    quantity:    +c.totalQty.toFixed(2),
    revenue:     +c.totalRevenue.toFixed(2),
    salesCount:  c.salesCount,
  }));

  if (loading) return (
    <div className="text-center py-20 text-gray-500">Loading category data...</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Category Summary</h1>
        <select className="border rounded-lg px-3 py-2 text-sm"
          value={days}
          onChange={e => setDays(+e.target.value)}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700">
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-xs text-gray-500 mb-1">Total Qty Sold</p>
          <p className="text-2xl font-bold text-blue-600">
            {totalQty.toFixed(1)} units
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-xs text-gray-500 mb-1">Categories</p>
          <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Revenue by Category - Bar */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold text-gray-700 mb-4">
            💰 Revenue by Category
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4,4,0,0]} name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Share - Pie */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold text-gray-700 mb-4">
            🥧 Revenue Share
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%"
                outerRadius={90} dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Revenue Trend */}
      <div className="bg-white rounded-xl p-4 shadow mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">
          📅 Daily Revenue Trend (Last {days} Days)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₹${v}`} />
            <Line type="monotone" dataKey="revenue"
              stroke="#16a34a" strokeWidth={2}
              dot={false} name="Revenue (₹)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Top Product</th>
              <th className="text-right p-3">Qty Sold</th>
              <th className="text-right p-3">Revenue</th>
              <th className="text-right p-3">Sales Entries</th>
              <th className="text-right p-3">Avg/Entry</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={c._id} className={`border-t ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                <td className="p-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-semibold">{c._id}</span>
                  </span>
                </td>
                <td className="p-3 text-gray-500">{c.topProduct}</td>
                <td className="p-3 text-right">{c.totalQty.toFixed(1)}</td>
                <td className="p-3 text-right font-semibold text-green-700">
                  ₹{c.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="p-3 text-right text-gray-500">{c.salesCount}</td>
                <td className="p-3 text-right text-gray-500">
                  ₹{(c.totalRevenue / c.salesCount).toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-green-50 font-bold">
              <td className="p-3" colSpan={2}>Total</td>
              <td className="p-3 text-right">{totalQty.toFixed(1)}</td>
              <td className="p-3 text-right text-green-700">
                ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </td>
              <td className="p-3 text-right">
                {categories.reduce((s, c) => s + c.salesCount, 0)}
              </td>
              <td className="p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}