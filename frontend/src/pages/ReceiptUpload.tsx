import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Info
} from 'lucide-react';
import { uploadReceipt, confirmReceipt, type UploadResponse, type LedgerEntry } from '../lib/api';
import { formatCurrency, getCategoryDisplayName } from '../lib/utils';

export default function ReceiptUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFile(droppedFile);
    }
  }, []);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadReceipt(file);
      setResult(response);
      if (!response.success) {
        setError(response.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to process receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.ledger_entry) return;
    
    setLoading(true);
    try {
      const response = await confirmReceipt(result.ledger_entry.transaction_id);
      setResult(response);
    } catch (err) {
      setError('Failed to confirm entry');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scan Receipt</h2>
        <p className="text-gray-600 dark:text-gray-400">Upload a receipt photo to create a ledger entry</p>
      </div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!result?.success ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`card p-8 border-2 border-dashed transition-all ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-dark-600'
              }`}
            >
              {preview ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Receipt preview"
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {file?.name}
                  </p>
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Process Receipt
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Drop receipt image here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports JPG, PNG, WebP
                    </p>
                  </div>
                </label>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Success Card */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {result.needs_confirmation ? 'Review Required' : 'Entry Created'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.needs_confirmation 
                      ? 'Please verify the extracted information'
                      : 'Successfully added to ledger'}
                  </p>
                </div>
              </div>

              {result.ledger_entry && (
                <EntryDetails entry={result.ledger_entry} />
              )}

              {result.needs_confirmation && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                        Confirmation Needed
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-500">
                        {result.confirmation_reason}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="btn-primary w-full mt-4"
                  >
                    {loading ? 'Confirming...' : 'Confirm Entry'}
                  </button>
                </div>
              )}
            </div>

            <button onClick={reset} className="btn-secondary w-full">
              Scan Another Receipt
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Tips for best results</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Ensure good lighting and clear focus</li>
          <li>• Include the total amount in the frame</li>
          <li>• GST details will be extracted if visible</li>
        </ul>
      </div>
    </div>
  );
}

function EntryDetails({ entry }: { entry: LedgerEntry }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(entry.amount)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {getCategoryDisplayName(entry.category)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">GST Rate</p>
          <p className="text-lg font-bold text-primary-600">{entry.gst_rate}%</p>
        </div>
        <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">GST Amount</p>
          <p className="text-lg font-bold text-primary-600">
            {formatCurrency(entry.gst_amount)}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Explanation</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{entry.explanation}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Confidence</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${entry.confidence * 100}%` }}
            />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {Math.round(entry.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
