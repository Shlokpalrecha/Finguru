import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Receipt, 
  Mic, 
  IndianRupee,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getDailySummary, getEntries, type DailySummary, type LedgerEntry } from '../lib/api';
import { formatCurrency, getCategoryColor, getCategoryDisplayName } from '../lib/utils';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function Dashboard() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryData, entriesData] = await Promise.all([
        getDailySummary(),
        getEntries(undefined, 5)
      ]);
      setSummary(summaryData);
      setRecentEntries(entriesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = summary ? Object.entries(summary.by_category).map(([name, value], index) => ({
    name: getCategoryDisplayName(name),
    value,
    color: COLORS[index % COLORS.length]
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Namaste! 🙏
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your business expenses with AI-powered insights
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/receipt">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card p-5 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
              <Receipt className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Scan Receipt</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload photo</p>
          </motion.div>
        </Link>

        <Link to="/voice">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card p-5 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Voice Entry</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Speak in Hinglish</p>
          </motion.div>
        </Link>
      </div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Summary</h3>
          <TrendingUp className="w-5 h-5 text-primary-600" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary?.total_amount || 0)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">GST Paid</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(summary?.total_gst || 0)}
            </p>
          </div>
        </div>

        {/* Category Chart */}
        {chartData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No expenses recorded today
          </div>
        )}

        {/* Category Legend */}
        <div className="flex flex-wrap gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Entries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Entries</h3>
          <Link to="/ledger" className="text-primary-600 text-sm font-medium flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {recentEntries.length > 0 ? (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.transaction_id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCategoryColor(entry.category)}`}>
                    {entry.source === 'receipt' ? (
                      <Receipt className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getCategoryDisplayName(entry.category)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.source === 'receipt' ? 'Receipt' : 'Voice'} • GST {entry.gst_rate}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(entry.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{formatCurrency(entry.gst_amount)} GST
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No entries yet</p>
            <p className="text-sm">Upload a receipt or record a voice expense</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
