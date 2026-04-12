import { useState, useCallback } from "react";
import { Upload, Camera, Image, Loader2, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Tesseract from 'tesseract.js';
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type UploadState = "idle" | "processing" | "complete";

interface ParsedReceipt {
  amount: number | null;
  categoryId: string;
  description: string;
  date: string;
}

export function ReceiptUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setState("processing");
    
    try {
      // 1. Perform Tesseract.js turkish + english support
      const result = await Tesseract.recognize(file, 'tur+eng', {
        logger: m => console.log(m)
      });
      
      const rawText = result.data.text;
      console.log("OCR Raw Text:", rawText);

      // 2. send text to backend for parsing
      const response = await fetch('http://localhost:5001/expenses/parse-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) throw new Error('Parsing failed');

      const data = await response.json();
      setParsedData(data);
      setState("complete");
    } catch (error: any) {
      toast({ title: "Extraction Error", description: error.message, variant: "destructive" });
      setState("idle");
    }
  };

  const handleSaveExpense = async () => {
    if (!parsedData || !token) return;
    
    try {
      const response = await fetch('http://localhost:5001/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parsedData.amount,
          categoryId: parsedData.categoryId,
          description: `Receipt: ${parsedData.categoryId}`,
          date: new Date(parsedData.date).toISOString(),
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Expense saved from receipt." });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        handleReset();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setState("idle");
    setFileName("");
    setParsedData(null);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">Receipt Upload</CardTitle>
        <CardDescription>Upload a receipt for automatic extraction (Turkish/English)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
              onClick={() => document.getElementById('receipt-input')?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Drag & drop your receipt</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </div>
                <input
                  id="receipt-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <label className="cursor-pointer">
                  <Image className="w-4 h-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <label className="cursor-pointer">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </>
        )}

        {state === "processing" && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="font-medium text-foreground">Reading receipt with OCR...</p>
            <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
          </div>
        )}

        {state === "complete" && parsedData && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              <span className="font-medium">Extraction complete!</span>
            </div>

            <div className="p-4 bg-muted rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-foreground">₺{parsedData.amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium text-foreground uppercase">{parsedData.categoryId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File:</span>
                <span className="text-xs text-foreground truncate max-w-[150px]">{fileName}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <X className="w-4 h-4 mr-2" /> Discard
              </Button>
              <Button onClick={handleSaveExpense} className="flex-1 gradient-primary">
                <Check className="w-4 h-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
