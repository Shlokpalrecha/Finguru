"""
Whisper Transcription Service using OpenAI API
For cloud deployment - uses OpenAI's Whisper API instead of local model
"""
import os
import tempfile
from dataclasses import dataclass
from openai import OpenAI
from config import get_settings

settings = get_settings()


@dataclass
class TranscriptionResult:
    """Result from transcription service."""
    raw_text: str
    confidence: float


class TranscribeService:
    """Whisper transcription service using OpenAI API."""
    
    def __init__(self):
        self.client = None
        if settings.openai_api_key:
            self.client = OpenAI(api_key=settings.openai_api_key)
    
    def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.webm") -> TranscriptionResult:
        """
        Transcribe audio from bytes using OpenAI's Whisper API.
        
        Args:
            audio_bytes: Raw audio data
            filename: Original filename (for format detection)
            
        Returns:
            TranscriptionResult with text and confidence
        """
        if not self.client:
            raise RuntimeError("OpenAI API key not configured")
        
        # Determine file extension
        ext = os.path.splitext(filename)[1] or ".webm"
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="hi",  # Hindi/Hinglish
                    response_format="text"
                )
            
            text = transcript.strip() if transcript else ""
            # OpenAI Whisper API doesn't return confidence, assume high confidence
            confidence = 0.9 if text else 0.0
            
            return TranscriptionResult(raw_text=text, confidence=confidence)
        
        except Exception as e:
            print(f"Whisper API error: {e}")
            raise RuntimeError(f"Transcription failed: {str(e)}")
        
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


# Global instance
transcribe_service = TranscribeService()
client = transcribe_service.client


def preload_model():
    """No-op for API-based Whisper - no model to preload"""
    print("Using OpenAI Whisper API (cloud-based)")
