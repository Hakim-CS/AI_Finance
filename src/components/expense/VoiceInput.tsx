import { API_BASE } from "@/lib/api";
import { useState, useRef } from "react";
import { Mic, MicOff, Loader2, Check, AlertCircle, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

type RecordingState = "idle" | "listening" | "stopped" | "processing" | "review";

interface ParsedExpense {
  amount: number | null;
  categoryId: string | null;
  description: string;
  date: string;
  notes: string | null;
  transcript?: string;
  whisperLanguage?: string;
  whisperModel?: string;
}

export function VoiceInput() {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [parsedData, setParsedData] = useState<ParsedExpense | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { formatAmount, language } = usePreferences();

  // ── Start / Stop recording using MediaRecorder API ────────────────────
  const toggleRecording = async () => {
    if (state === "listening") {
      // Stop recording
      mediaRecorderRef.current?.stop();
      return;
    }

    // Reset state
    setTranscript("");
    setParsedData(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        setState("stopped");
      };

      mediaRecorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        toast({ title: t('common.error'), description: "Microphone error", variant: "destructive" });
        setState("idle");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState("listening");
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || "Microphone access denied",
        variant: "destructive",
      });
      setState("idle");
    }
  };

  // ── Send audio to backend for Whisper transcription + NLP parsing ─────
  const handleProcessAudio = async () => {
    if (audioChunksRef.current.length === 0 || !token) return;
    setState("processing");

    try {
      // Build the audio blob from recorded chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Create FormData with the audio file and language
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      // Send to Whisper transcription endpoint
      const response = await fetch(`${API_BASE}/expenses/transcribe-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Do NOT set Content-Type — browser sets it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Transcription failed');
      }

      const data: ParsedExpense = await response.json();
      setTranscript(data.transcript || data.description || "");
      setParsedData(data);
      setState("review");
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
      setState("stopped");
    }
  };

  // ── Save confirmed expense to database ────────────────────────────────
  const handleSaveExpense = async () => {
    if (!parsedData || !token) return;
    setState("processing");

    const finalCategoryId = parsedData.categoryId || "other";
    const finalAmount = Number(parsedData.amount);

    try {
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: finalAmount,
          categoryId: finalCategoryId,
          description: parsedData.description || t('addExpensePage.voice.title'),
          date: new Date(parsedData.date).toISOString(),
          notes: parsedData.notes || "",
        }),
      });

      if (response.ok) {
        toast({ title: t('common.success'), description: t('addExpensePage.manual.added') });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        handleReset();
      } else {
        const err = await response.json();
        throw new Error(err.message || "Save failed");
      }
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
      setState("review");
    }
  };

  const handleReset = () => {
    setTranscript("");
    setParsedData(null);
    audioChunksRef.current = [];
    setState("idle");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {t('addExpensePage.voice.title')}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">
            <Brain className="w-3 h-3" /> Whisper AI
          </span>
        </CardTitle>
        <CardDescription>{t('addExpensePage.voice.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {/* Microphone button */}
        <Button
          size="lg"
          onClick={toggleRecording}
          disabled={state === "processing"}
          className={cn(
            "w-24 h-24 rounded-full transition-all duration-300 relative",
            state === "listening" ? "bg-destructive animate-pulse" : "gradient-primary"
          )}
        >
          {state === "listening" ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          {state === "listening" && <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />}
        </Button>

        {/* Status text */}
        <p className="text-sm font-medium">
          {state === "idle" && t('addExpensePage.voice.tapStart')}
          {state === "listening" && t('addExpensePage.voice.listening')}
          {state === "stopped" && (audioChunksRef.current.length > 0 ? "Recording ready — click Analyze to transcribe with AI" : t('common.noSpeechDetected'))}
          {state === "processing" && (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is transcribing your speech...
            </span>
          )}
          {state === "review" && t('common.verifyExtraction')}
        </p>

        {/* Transcript display */}
        {transcript && (
          <div className="w-full p-3 bg-muted rounded-lg text-sm italic border border-border">
            "{transcript}"
            {parsedData?.whisperModel && (
              <p className="text-[10px] text-muted-foreground mt-1 not-italic">
                Transcribed by Whisper ({parsedData.whisperModel}) • Detected: {parsedData.whisperLanguage}
              </p>
            )}
          </div>
        )}

        {/* Review panel */}
        {state === "review" && parsedData && (
          <div className="w-full space-y-4">
            <div className="p-4 bg-primary/5 border rounded-xl space-y-2 text-sm text-left">
              <p><strong>{t('addExpensePage.manual.amount')}:</strong> {parsedData.amount ? formatAmount(parsedData.amount) : '???'}</p>
              <p><strong>{t('addExpensePage.manual.category')}:</strong> {t(`categories.${parsedData.categoryId || 'other'}`)}</p>
              <p><strong>{t('addExpensePage.manual.descriptionLabel')}:</strong> {parsedData.description}</p>
              <p><strong>{t('addExpensePage.manual.date')}:</strong> {parsedData.date}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">{t('common.discard')}</Button>
              <Button onClick={handleSaveExpense} className="flex-1 gradient-primary" disabled={!parsedData.amount}>{t('common.save')}</Button>
            </div>
          </div>
        )}

        {/* Analyze button */}
        {state === "stopped" && audioChunksRef.current.length > 0 && !parsedData && (
          <Button onClick={handleProcessAudio} className="w-full gradient-primary">
            <Brain className="w-4 h-4 mr-2" />
            {t('common.analyze')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
