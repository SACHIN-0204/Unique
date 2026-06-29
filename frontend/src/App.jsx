import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import { ToastContainer, toast } from './components/Toast';
import { getProducts } from './api';

import Home from './pages/Home';
import Predictions from './pages/Predictions';
import ReorderReport from './pages/ReorderReport';
import RecordSale from './pages/RecordSales';
import BatchPredictions from './pages/BatchPredictions';
import CategorySummary from './pages/CategorySummary';

export default function App() {

   // Auto-check low stock on app load
  useEffect(() => {
    getProducts().then(res => {
      const lowItems = res.data.filter(p => p.stockStatus === 'LOW');
      if (lowItems.length > 0) {
        setTimeout(() => {
          toast.warning(
            `⚠️ ${lowItems.length} item(s) need reorder: ${
              lowItems.slice(0, 2).map(p => p.name).join(', ')
            }${lowItems.length > 2 ? '...' : ''}`,
            6000
          );
        }, 1000);
      } else {
        setTimeout(() => {
          toast.success('✅ All stock levels are sufficient!', 3000);
        }, 1000);
      }
    }).catch(() => {
      toast.error('❌ Could not connect to backend server.', 5000);
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/reorder"    element={<ReorderReport />} />
            <Route path="/record-sale" element={<RecordSale />} />
            <Route path="/batch" element={<BatchPredictions />} />
            <Route path="/category" element={<CategorySummary />} />
          </Routes>
        </div>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}