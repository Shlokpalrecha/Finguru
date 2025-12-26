import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart, 
  Lightbulb, 
  IndianRupee,
  Receipt,
  Loader2,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import api from '../lib/api';

interface AdvisorInsight {
  summary: string;
  total_expenses: number;
  total_gst: number;
  top_category: string;
  top_category_amount: number;
  entry_count: number;
  tips: string[];
  gst_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
}

export default function Advisor() {
  const [insights, setInsights] = useState<AdvisorInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/advisor/insights');
      setInsights(response.data);
    } catch (err) {
      setError('Failed to load insights. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Analyzing your expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadInsights} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!insights) return null;

  const categoryColors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary-600" />
            Your CA Companion
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Smart insights for your business</p>
        </div>
        <button 
          onClick={loadInsights}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Financial Summary</h3>
            <p className="text-white/90 leading-relaxed">{insights.summary}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(insights.total_expenses)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">GST Liability</span>
          </div>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(insights.total_gst)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Top Category</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {insights.top_category}
          </p>
          <p className="text-sm text-gray-500">{formatCurrency(insights.top_category_amount)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Entries</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {insights.entry_count}
          </p>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(insights.category_breakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-600" />
            Expense Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(insights.category_breakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount], index) => {
                const percentage = (amount / insights.total_expenses) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{category}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${categoryColors[index % categoryColors.length]}`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* GST Breakdown */}
      {Object.keys(insights.gst_breakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary-600" />
            GST by Category
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(insights.gst_breakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([category, gst]) => (
                <div key={category} className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{category}</p>
                  <p className="font-semibold text-primary-600">{formatCurrency(gst)}</p>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          CA Tips & Insights
        </h3>
        <div className="space-y-3">
          {insights.tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
