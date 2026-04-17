/**
 * AvatarCropper
 * ─────────────
 * Modal dialog that lets the user crop a selected image to a square
 * before it is uploaded to the backend.
 *
 * Flow:
 *  1. User clicks avatar → file picker opens (handled in parent)
 *  2. Parent passes the selected File as `imageSrc` to open this modal
 *  3. User drags/zooms to position crop area
 *  4. "Save Photo" → croppedBlob is returned via `onCropComplete`
 *  5. Parent POSTs the Blob as FormData to /auth/avatar
 *
 * Usage:
 *   <AvatarCropper
 *     imageSrc={previewUrl}          // object URL from URL.createObjectURL(file)
 *     onCropComplete={(blob) => ...} // upload the blob
 *     onClose={() => setImageSrc("")}
 *   />
 */
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, Loader2, CheckCircle } from "lucide-react";

// ─── Pixel crop helper ────────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await createImageBitmap(await fetch(imageSrc).then(r => r.blob()));
  const canvas = document.createElement("canvas");
  const SIZE = 400; // output: 400×400 px square
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,           // source x, y
    pixelCrop.width, pixelCrop.height,   // source width, height
    0, 0,                                // dest x, y
    SIZE, SIZE                           // dest width, height (stretch to square)
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
      "image/jpeg",
      0.92   // quality 92% — good balance of size vs quality
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AvatarCropperProps {
  imageSrc: string;               // object URL of the selected image
  onCropComplete: (blob: Blob) => void;
  onClose: () => void;
}

export function AvatarCropper({ imageSrc, onCropComplete, onClose }: AvatarCropperProps) {
  const [crop, setCrop]         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]         = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isCropping, setIsCropping]   = useState(false);

  const onCropChange = useCallback((c: { x: number; y: number }) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);

  const onCropAreaComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedArea(pixelCrop);
  }, []);

  const handleSave = async () => {
    if (!croppedArea) return;
    setIsCropping(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      onCropComplete(blob);
    } catch (e) {
      console.error("Crop failed", e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border bg-card">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-bold">Crop Your Photo</DialogTitle>
        </DialogHeader>

        {/* ── Crop canvas area ───────────────────────────────────────────── */}
        <div className="relative w-full" style={{ height: 320, background: "#000" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}                    // enforce 1:1 square
            cropShape="round"             // circular preview (matches avatar)
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle:  { border: "2px solid hsl(var(--primary))" },
            }}
          />
        </div>

        {/* ── Zoom slider ────────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-2">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            Drag to reposition · Scroll or slide to zoom
          </p>
        </div>

        {/* ── Footer actions ─────────────────────────────────────────────── */}
        <DialogFooter className="px-6 pb-5 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isCropping || !croppedArea}
            className="gradient-primary hover:opacity-90 rounded-xl flex-1 sm:flex-none"
          >
            {isCropping
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
              : <><CheckCircle className="mr-2 h-4 w-4" />Save Photo</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
