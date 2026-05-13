"""
transcribe.py
=============================================================================
Self-hosted Speech-to-Text using OpenAI Whisper (runs locally, no API calls).

This script replaces the browser's Web Speech API with a real ML model
that runs entirely on the user's machine.

Usage:
    python transcribe.py <audio_file_path> [language_code]

Arguments:
    audio_file_path  - Path to audio file (webm, wav, mp3, m4a, etc.)
    language_code    - Optional: "en", "tr", or "de" (auto-detect if omitted)

Output:
    JSON to stdout: { "text": "transcribed text", "language": "en", "model": "base" }

Model:
    Uses Whisper "base" model (~74MB, good accuracy-speed tradeoff).
    First run downloads the model automatically to ~/.cache/whisper/

Requirements:
    pip install openai-whisper

Author : Aura Finance Thesis Project
Date   : May 2026
=============================================================================
"""

import sys
import json
import os
import warnings

warnings.filterwarnings("ignore")


def main():
    # ── Parse arguments ──────────────────────────────────────────────────
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python transcribe.py <audio_file> [language]"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"File not found: {audio_path}"}))
        sys.exit(1)

    # ── Load Whisper ─────────────────────────────────────────────────────
    try:
        import whisper
    except ImportError:
        print(json.dumps({
            "error": "Whisper not installed. Run: pip install openai-whisper"
        }))
        sys.exit(1)

    # ── Select model ─────────────────────────────────────────────────────
    # "base" = 74MB, ~3s per short clip on CPU. Good balance for thesis.
    # Options: tiny (39MB), base (74MB), small (244MB), medium (769MB)
    MODEL_SIZE = "base"

    try:
        model = whisper.load_model(MODEL_SIZE)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load Whisper model: {str(e)}"}))
        sys.exit(1)

    # ── Transcribe ───────────────────────────────────────────────────────
    try:
        options = {}
        if language:
            options["language"] = language

        result = model.transcribe(audio_path, **options)

        output = {
            "text": result["text"].strip(),
            "language": result.get("language", language or "unknown"),
            "model": MODEL_SIZE,
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"error": f"Transcription failed: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
