"""Transcription service using local OpenAI Whisper model"""
import io
import os
import tempfile
import warnings
from typing import Optional
from models.schemas import VoiceTranscription

# Suppress FP16 warning on CPU
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU")

# Global model instance (loaded once at startup)
_whisper_model = None
_model_name = "base"  # Options: tiny, base, small, medium, large


def get_whisper_model():
    """Load Whisper model once and reuse for all requests."""
    global _whisper_model
    
    if _whisper_model is None:
        try:
            import whisper
            print(f"Loading Whisper model '{_model_name}'...")
            _whisper_model = whisper.load_model(_model_name)
            print(f"Whisper model '{_model_name}' loaded successfully!")
        except ImportError:
            print("ERROR: openai-whisper not installed. Run: pip install openai-whisper")
            raise
        except Exception as e:
            print(f"ERROR loading Whisper model: {e}")
            raise
    
    return _whisper_model


class TranscribeService:
    """Handle transcription using local OpenAI Whisper model."""
    
    def __init__(self):
        self.model = None
        self._initialized = False
    
    def _ensure_model(self):
        """Lazy load the model on first use."""
        if not self._initialized:
            try:
                self.model = get_whisper_model()
                self._initialized = True
            except Exception as e:
                print(f"Failed to initialize Whisper: {e}")
                self.model = None
                self._initialized = True
    
    def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.webm") -> VoiceTranscription:
        """
        Transcribe audio using local Whisper model.
        
        Args:
            audio_bytes: Raw audio file bytes
            filename: Original filename (used for extension detection)
            
        Returns:
            VoiceTranscription with raw_text, language, and confidence
        """
        self._ensure_model()
        
        if self.model is None:
            return VoiceTranscription(
                raw_text="",
                language="hi-IN",
                confidence=0.0
            )
        
        try:
            # Write audio to temp file (Whisper needs file path)
            ext = os.path.splitext(filename)[1] or ".webm"
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
            
            try:
                # Transcribe with Whisper
                # language="hi" for Hindi/Hinglish support
                result = self.model.transcribe(
                    tmp_path,
                    language="hi",
                    task="transcribe",
                    fp16=False  # Use FP32 for CPU compatibility
                )
                
                text = result.get("text", "").strip()
                
                # Calculate average confidence from segments
                segments = result.get("segments", [])
                if segments:
                    avg_confidence = sum(
                        seg.get("no_speech_prob", 0) for seg in segments
                    ) / len(segments)
                    # no_speech_prob is inverse of confidence
                    confidence = max(0.0, min(1.0, 1.0 - avg_confidence))
                else:
                    confidence = 0.9 if text else 0.0
                
                return VoiceTranscription(
                    raw_text=text,
                    language=result.get("language", "hi"),
                    confidence=confidence
                )
                
            finally:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    
        except Exception as e:
            print(f"Whisper transcription error: {e}")
            return VoiceTranscription(
                raw_text="",
                language="hi-IN",
                confidence=0.0
            )


# Singleton instance
transcribe_service = TranscribeService()


def preload_model():
    """Preload the Whisper model at startup."""
    try:
        get_whisper_model()
        return True
    except Exception as e:
        print(f"Warning: Could not preload Whisper model: {e}")
        return False
