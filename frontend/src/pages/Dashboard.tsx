import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Receipt, 
  Mic, 
  IndianRupee,
  ArrowUpRight,
  Loader2,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getDailySummary, getEntries, type DailySummary, type LedgerEntry } from '../lib/api';
import { formatCurrency, getCategoryColor, getCategoryDisplayName } from '../lib/utils';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

// Animated counter component
function AnimatedCounter({ value, prefix = '₹' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString('en-IN')}
    </span>
  );
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary-500/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: '100%',
            opacity: 0 
          }}
          animate={{ 
            y: '-20%',
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="card p-6 relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 text-white"
      >
        <FloatingParticles />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="flex items-center gap-2 mb-3"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium text-primary-100">AI-Powered Finance</span>
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">
            Namaste! 🙏
          </h2>
          <p className="text-primary-100">
            Your intelligent financial companion for MSME success
          </p>
        </div>
        
        {/* Decorative circles */}
        <motion.div 
          className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -right-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      {/* Quick Actions with hover effects */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Link to="/receipt">
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="card p-5 cursor-pointer group relative overflow-hidden"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary-500/20"
            >
              <Receipt className="w-7 h-7 text-primary-600" />
            </motion.div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Scan Receipt</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload & auto-extract</p>
            <motion.div 
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100"
              initial={{ x: -10 }}
              whileHover={{ x: 0 }}
            >
              <ArrowUpRight className="w-5 h-5 text-primary-500" />
            </motion.div>
          </motion.div>
        </Link>

        <Link to="/voice">
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="card p-5 cursor-pointer group relative overflow-hidden"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20"
            >
              <Mic className="w-7 h-7 text-blue-600" />
            </motion.div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Voice Entry</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Speak in Hinglish</p>
            <motion.div 
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100"
              initial={{ x: -10 }}
              whileHover={{ x: 0 }}
            >
              <ArrowUpRight className="w-5 h-5 text-blue-500" />
            </motion.div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Stats Cards with animated counters */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <motion.div 
          className="card p-5 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="absolute -right-4 -top-4 w-20 h-20 bg-primary-500/10 rounded-full"
          />
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            <AnimatedCounter value={summary?.total_amount || 0} />
          </p>
          <p className="text-xs text-gray-400 mt-1">{summary?.entry_count || 0} transactions</p>
        </motion.div>

        <motion.div 
          className="card p-5 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full"
          />
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">GST Claimable</p>
          </div>
          <p className="text-3xl font-bold text-green-600">
            <AnimatedCounter value={summary?.total_gst || 0} />
          </p>
          <p className="text-xs text-gray-400 mt-1">Input Tax Credit</p>
        </motion.div>
      </motion.div>

      {/* Category Breakdown with animated chart */}
      <motion.div
        variants={itemVariants}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Breakdown</h3>
          </div>
        </div>

        {chartData.length > 0 ? (
          <motion.div 
            className="h-52"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div 
            className="h-52 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <IndianRupee className="w-12 h-12 mb-3 opacity-30" />
            </motion.div>
            <p>No expenses recorded today</p>
          </motion.div>
        )}

        {/* Animated Legend */}
        <motion.div 
          className="flex flex-wrap gap-3 mt-4 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {chartData.map((item, index) => (
            <motion.div 
              key={index} 
              className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-dark-700 px-3 py-1.5 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Recent Entries with staggered animation */}
      <motion.div
        variants={itemVariants}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <Link to="/ledger">
            <motion.span 
              className="text-primary-600 text-sm font-medium flex items-center gap-1"
              whileHover={{ x: 3 }}
            >
              View All <ArrowUpRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </div>

        <AnimatePresence>
          {recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry, index) => (
                <motion.div
                  key={entry.transaction_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${getCategoryColor(entry.category)} shadow-lg`}
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                    >
                      {entry.source === 'receipt' ? (
                        <Receipt className="w-5 h-5 text-white" />
                      ) : (
                        <Mic className="w-5 h-5 text-white" />
                      )}
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getCategoryDisplayName(entry.category)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.source === 'receipt' ? '📄 Receipt' : '🎤 Voice'} • GST {entry.gst_rate}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(entry.amount)}
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      +{formatCurrency(entry.gst_amount)} GST
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="text-center py-10 text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <IndianRupee className="w-16 h-16 mx-auto mb-4 opacity-30" />
              </motion.div>
              <p className="font-medium">No entries yet</p>
              <p className="text-sm mt-1">Upload a receipt or record a voice expense to get started!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
