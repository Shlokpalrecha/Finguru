"""
Whisper Transcription Service using OpenAI API
For cloud deployment - uses OpenAI's Whisper API instead of local model
"""
import os
import tempfile
from openai import OpenAI
from config import get_settings

settings = get_settings()

# Initialize OpenAI client
client = None
if settings.openai_api_key:
    client = OpenAI(api_key=settings.openai_api_key)


def preload_model():
    """No-op for API-based Whisper - no model to preload"""
    print("Using OpenAI Whisper API (cloud-based)")


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio file using OpenAI's Whisper API.
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        Transcribed text
    """
    if not client:
        raise RuntimeError("OpenAI API key not configured")
    
    try:
        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="hi",  # Hindi/Hinglish
                response_format="text"
            )
        
        return transcript.strip()
    
    except Exception as e:
        print(f"Whisper API error: {e}")
        raise RuntimeError(f"Transcription failed: {str(e)}")


def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribe audio from bytes using OpenAI's Whisper API.
    
    Args:
        audio_bytes: Raw audio data
        filename: Original filename (for format detection)
        
    Returns:
        Transcribed text
    """
    if not client:
        raise RuntimeError("OpenAI API key not configured")
    
    # Determine file extension
    ext = os.path.splitext(filename)[1] or ".webm"
    
    # Write to temp file
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        result = transcribe_audio(tmp_path)
        return result
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
