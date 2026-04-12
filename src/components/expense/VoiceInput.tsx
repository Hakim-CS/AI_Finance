import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type RecordingState = "idle" | "listening" | "stopped" | "processing" | "review";

interface ParsedExpense {
  amount: number | null;
  categoryId: string | null;
  description: string;
  date: string;
  notes: string | null;
}

export function VoiceInput() {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [parsedData, setParsedData] = useState<ParsedExpense | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'tr-TR';

    recognition.onstart = () => setState("listening");
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        toast({ title: "Voice Error", description: event.error, variant: "destructive" });
      }
      setState("idle");
    };

    recognition.onend = () => {
      setTimeout(() => {
        setState(prev => (prev === "listening" ? "stopped" : prev));
      }, 150);
    };

    recognitionRef.current = recognition;
  }, [toast]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (state === "listening") {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setParsedData(null);
      recognitionRef.current.start();
    }
  };

  const handleProcessTranscript = async () => {
    if (!transcript || !token) return;
    setState("processing");

    try {
      const response = await fetch('http://localhost:5001/expenses/parse-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) throw new Error('Parsing failed');

      const data = await response.json();
      console.log("AI Parsed Data:", data);
      setParsedData(data);
      setState("review");
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
      setState("stopped");
    }
  };

  const handleSaveExpense = async () => {
    if (!parsedData || !token) return;
    setState("processing");

    // Clean up the categoryId - if AI didn't find one, default to 'other'
    const finalCategoryId = parsedData.categoryId || "other";
    const finalAmount = Number(parsedData.amount);

    console.log("Sending to Save:", {
      amount: finalAmount,
      categoryId: finalCategoryId,
      description: parsedData.description,
      date: parsedData.date,
    });

    try {
      const response = await fetch('http://localhost:5001/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: finalAmount,
          categoryId: finalCategoryId,
          description: parsedData.description || "Voice Expense",
          date: new Date(parsedData.date).toISOString(),
          notes: parsedData.notes || "",
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Expense recorded." });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        handleReset();
      } else {
        const err = await response.json();
        throw new Error(err.message || "Save failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setState("review");
    }
  };

  const handleReset = () => {
    setTranscript("");
    setParsedData(null);
    setState("idle");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">Voice Input</CardTitle>
        <CardDescription>Speak your expense (Turkish supported)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
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

        <p className="text-sm font-medium">
          {state === "idle" && "Tap to start"}
          {state === "listening" && "Listening..."}
          {state === "stopped" && (transcript ? "Review Transcript" : "No speech detected")}
          {state === "processing" && "Processing..."}
          {state === "review" && "Verify AI Extraction"}
        </p>

        {transcript && (
          <div className="w-full p-3 bg-muted rounded-lg text-sm italic border border-border">
            "{transcript}"
          </div>
        )}

        {state === "review" && parsedData && (
          <div className="w-full space-y-4">
            <div className="p-4 bg-primary/5 border rounded-xl space-y-2 text-sm text-left">
              <p><strong>Amount:</strong> ₺{parsedData.amount || '???'}</p>
              <p><strong>Category:</strong> {parsedData.categoryId || 'Other'}</p>
              <p><strong>Description:</strong> {parsedData.description}</p>
              <p><strong>Date:</strong> {parsedData.date}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">Discard</Button>
              <Button onClick={handleSaveExpense} className="flex-1 gradient-primary" disabled={!parsedData.amount}>Save</Button>
            </div>
          </div>
        )}

        {state === "stopped" && transcript && !parsedData && (
          <Button onClick={handleProcessTranscript} className="w-full gradient-primary">
            Analyze Voice
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
