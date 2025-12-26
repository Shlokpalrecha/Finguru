import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  Mic, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Filter
} from 'lucide-react';
import { getEntries, deleteEntry, type LedgerEntry } from '../lib/api';
import { formatCurrency, formatDate, getCategoryColor, getCategoryDisplayName } from '../lib/utils';

export default function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [filterDate]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await getEntries(filterDate || undefined, 50);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    setDeleting(transactionId);
    try {
      await deleteEntry(transactionId);
      setEntries(entries.filter(e => e.transaction_id !== transactionId));
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalGst = entries.reduce((sum, e) => sum + e.gst_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ledger</h2>
          <p className="text-gray-600 dark:text-gray-400">All your expense entries</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Filter</span>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total GST</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(totalGst)}
          </p>
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-8 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No entries found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {filterDate ? 'Try a different date' : 'Upload a receipt or record a voice expense'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry, index) => (
              <motion.div
                key={entry.transaction_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="card overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(entry.transaction_id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
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
                          {formatDate(entry.date)} • {entry.source}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(entry.amount)}
                        </p>
                        <p className="text-xs text-primary-600">
                          +{formatCurrency(entry.gst_amount)} GST
                        </p>
                      </div>
                      {expandedId === entry.transaction_id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === entry.transaction_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 dark:border-dark-700"
                    >
                      <div className="p-4 space-y-3 bg-gray-50 dark:bg-dark-700/50">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">GST Rate</p>
                            <p className="font-medium text-gray-900 dark:text-white">{entry.gst_rate}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Confidence</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {Math.round(entry.confidence * 100)}%
                            </p>
                          </div>
                          {entry.vendor_name && (
                            <div className="col-span-2">
                              <p className="text-gray-500 dark:text-gray-400">Vendor</p>
                              <p className="font-medium text-gray-900 dark:text-white">{entry.vendor_name}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Explanation</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{entry.explanation}</p>
                        </div>

                        {entry.raw_text && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {entry.source === 'voice' ? 'Transcription' : 'Extracted Text'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              "{entry.raw_text.substring(0, 200)}..."
                            </p>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.transaction_id);
                            }}
                            disabled={deleting === entry.transaction_id}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            {deleting === entry.transaction_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
