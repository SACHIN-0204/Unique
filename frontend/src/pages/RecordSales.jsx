import { useEffect, useState } from 'react';
import { getProducts, recordSale, recordBulkSales } from '../api';
import { PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import { toast } from '../components/Toast';

const emptyRow = (products) => ({
  productId:    products[0]?._id || '',
  productName:  products[0]?.name || '',
  quantitySold: '',
  revenue:      '',
});

export default function RecordSale() {
  const [products, setProducts] = useState([]);
  const [mode, setMode]         = useState('single');  // single | bulk
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows]         = useState([]);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getProducts().then(res => {
      setProducts(res.data);
      setRows([emptyRow(res.data)]);
    });
  }, []);

  const addRow = () => setRows(r => [...r, emptyRow(products)]);

  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));

  const updateRow = (i, field, value) => {
    setRows(r => r.map((row, idx) => {
      if (idx !== i) return row;
      const updated = { ...row, [field]: value };
      if (field === 'productId') {
        const p = products.find(p => p._id === value);
        updated.productName = p?.name || '';
      }
      return updated;
    }));
  };

  const handleSubmit = async () => {
    setError(''); setMsg(''); setLoading(true);
    try {
      const validRows = rows.filter(r => r.productId && r.quantitySold > 0);
      if (!validRows.length) {
        setError('Please fill in at least one sale entry.'); return;
      }

      const payload = validRows.map(r => ({
        productId:    r.productId,
        productName:  r.productName,
        date,
        quantitySold: parseFloat(r.quantitySold),
        revenue:      parseFloat(r.revenue) || 0,
      }));

      if (mode === 'single') {
        await recordSale(payload[0]);
      } else {
        await recordBulkSales(payload);
      }

      // setMsg(`✅ ${payload.length} sale(s) recorded for ${date}!`);
      toast.success(`✅ ${payload.length} sale(s) recorded for ${date}!`);
      setRows([emptyRow(products)]);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      // setError(err.response?.data?.error || 'Failed to record sale');
      toast.error(err.response?.data?.error || 'Failed to record sale');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🧾 Record Daily Sales</h1>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        {['single', 'bulk'].map(m => (
          <button key={m}
            onClick={() => { setMode(m); setRows([emptyRow(products)]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${mode === m
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {m === 'single' ? '📝 Single Entry' : '📋 Bulk Entry'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow">
        {/* Date Picker */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-600 block mb-1">Sale Date</label>
          <input type="date"
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-48"
            value={date}
            onChange={e => setDate(e.target.value)} />
        </div>

        {/* Sale Rows */}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center
              bg-gray-50 rounded-lg p-3">

              {/* Product */}
              <div className={mode === 'bulk' ? 'col-span-5' : 'col-span-6'}>
                <label className="text-xs text-gray-500 mb-1 block">Product</label>
                <select
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={row.productId}
                  onChange={e => updateRow(i, 'productId', e.target.value)}>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="col-span-3">
                <label className="text-xs text-gray-500 mb-1 block">Qty Sold</label>
                <input type="number" min="0" step="0.5"
                  placeholder="e.g. 5"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={row.quantitySold}
                  onChange={e => updateRow(i, 'quantitySold', e.target.value)} />
              </div>

              {/* Revenue */}
              <div className="col-span-3">
                <label className="text-xs text-gray-500 mb-1 block">Revenue (₹)</label>
                <input type="number" min="0"
                  placeholder="e.g. 250"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={row.revenue}
                  onChange={e => updateRow(i, 'revenue', e.target.value)} />
              </div>

              {/* Remove (bulk only) */}
              {mode === 'bulk' && (
                <div className="col-span-1 flex items-end pb-1">
                  <button onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600 mt-5">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Row (bulk mode) */}
        {mode === 'bulk' && (
          <button onClick={addRow}
            className="mt-3 flex items-center gap-2 text-sm text-green-700
              hover:text-green-900 font-medium">
            <PlusCircle size={16} /> Add Another Product
          </button>
        )}

        {/* Feedback */}
        {msg   && <p className="mt-4 text-green-600 font-medium flex items-center gap-2">
          <CheckCircle size={16} /> {msg}</p>}
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          className="mt-5 w-full bg-green-700 text-white py-3 rounded-lg
            font-semibold hover:bg-green-800 disabled:opacity-50 transition">
          {loading ? 'Recording...' : `Record ${rows.length > 1 ? rows.length + ' Sales' : 'Sale'}`}
        </button>
      </div>
    </div>
  );
}