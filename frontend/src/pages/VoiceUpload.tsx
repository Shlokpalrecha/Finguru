import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Info,
  Volume2,
  Upload,
  FileAudio
} from 'lucide-react';
import { uploadVoice, uploadVoiceText, confirmVoice, type UploadResponse, type LedgerEntry } from '../lib/api';
import { formatCurrency, getCategoryDisplayName } from '../lib/utils';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type InputMode = 'record' | 'upload';

export default function VoiceUpload() {
  const [mode, setMode] = useState<InputMode>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [supported, setSupported] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (final) setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = () => {
      setError('Speech recognition error. Please try again.');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    
    setIsRecording(true);
    setTranscript('');
    setInterimTranscript('');
    setRecordingTime(0);
    setResult(null);
    setError(null);

    timerRef.current = window.setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleRecordUpload = async () => {
    const finalText = transcript.trim();
    if (!finalText) {
      setError('No speech detected. Please try again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadVoiceText(finalText);
      setResult(response);
      if (!response.success) setError(response.error || 'Processing failed');
    } catch {
      setError('Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|ogg|m4a)$/i)) {
        setError('Please upload an audio file (MP3, WAV, WebM, OGG, M4A)');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select an audio file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadVoice(selectedFile);
      setResult(response);
      if (!response.success) setError(response.error || 'Processing failed');
    } catch {
      setError('Failed to process audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.ledger_entry) return;
    
    setLoading(true);
    try {
      const response = await confirmVoice(result.ledger_entry.transaction_id);
      setResult(response);
    } catch {
      setError('Failed to confirm entry');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTranscript('');
    setInterimTranscript('');
    setResult(null);
    setError(null);
    setRecordingTime(0);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Entry</h2>
        <p className="text-gray-600 dark:text-gray-400">Speak or upload your expense in Hindi or Hinglish</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl">
        <button
          onClick={() => { setMode('record'); reset(); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'record'
              ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Mic className="w-4 h-4" />
          Record
        </button>
        <button
          onClick={() => { setMode('upload'); reset(); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'upload'
              ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Audio
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!result?.success ? (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {mode === 'record' ? (
              /* Recording Mode */
              <div className="card p-8 text-center">
                {!supported ? (
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Browser Recording Not Supported
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Use Chrome for recording, or upload an audio file instead.
                    </p>
                    <button onClick={() => setMode('upload')} className="btn-primary">
                      Upload Audio File
                    </button>
                  </div>
                ) : (
                  <>
                    <motion.button
                      onClick={isRecording ? stopRecording : startRecording}
                      whileTap={{ scale: 0.95 }}
                      className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                          : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      {isRecording ? (
                        <Square className="w-12 h-12 text-white" />
                      ) : (
                        <Mic className="w-12 h-12 text-white" />
                      )}
                    </motion.button>

                    <p className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                      {isRecording ? 'Listening...' : 'Tap to speak'}
                    </p>
                    
                    {isRecording && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-3xl font-mono text-red-500 mt-2"
                      >
                        {formatTime(recordingTime)}
                      </motion.p>
                    )}

                    {(transcript || interimTranscript) && (
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-left">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Transcription</p>
                        <p className="text-gray-900 dark:text-white">
                          {transcript}
                          <span className="text-gray-400">{interimTranscript}</span>
                        </p>
                      </div>
                    )}

                    {!isRecording && transcript && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                          <Volume2 className="w-5 h-5" />
                          <span>Recording complete ({formatTime(recordingTime)})</span>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button onClick={reset} className="btn-secondary">Re-record</button>
                          <button
                            onClick={handleRecordUpload}
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                          >
                            {loading ? (
                              <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                            ) : 'Process'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Upload Mode */
              <div className="card p-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-dark-500 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
                  >
                    <FileAudio className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Upload Voice Note
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Drop an audio file or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports MP3, WAV, WebM, OGG, M4A
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
                      <FileAudio className="w-10 h-10 text-primary-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                      <button onClick={reset} className="btn-secondary">
                        Choose Different
                      </button>
                      <button
                        onClick={handleFileUpload}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                      >
                        {loading ? (
                          <><Loader2 className="w-5 h-5 animate-spin" />Transcribing...</>
                        ) : (
                          <><Upload className="w-5 h-5" />Process Audio</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
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
                      ? 'Please verify the details'
                      : 'Successfully added to ledger'}
                  </p>
                </div>
              </div>

              {result.ledger_entry && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Transcription</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      "{result.ledger_entry.raw_text}"
                    </p>
                  </div>

                  <EntryDetails entry={result.ledger_entry} />
                </>
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
              Add Another Expense
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example Phrases */}
      <div className="card p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Example phrases</h4>
        <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
          <li>• "Bought 780 rupees worth of paint from the shop yesterday"</li>
          <li>• "Aaj chai ke 120 rupaye kharch hue"</li>
          <li>• "Office supplies ka 500 rupees ka bill"</li>
          <li>• "Auto mein 80 rupaye diye"</li>
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
