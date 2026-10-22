import { useEffect, useRef, useState } from 'react';
import { Check, Edit3, Eraser, PenTool, RotateCcw, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DigitalSignaturePadProps {
  signerName: string;
  onSignatureChange: (signature: { type: 'drawn' | 'typed'; data: string; isValid: boolean }) => void;
}

export function DigitalSignaturePad({ signerName, onSignatureChange }: DigitalSignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<'#0f172a' | '#1e40af'>('#1e40af'); // blue ink or black ink
  const [typedFont, setTypedFont] = useState<'cursive-1' | 'cursive-2' | 'cursive-3'>('cursive-1');
  const [typedText, setTypedText] = useState(signerName || '');

  // Keep typedText in sync if signerName changes
  useEffect(() => {
    if (signerName && !typedText) {
      setTypedText(signerName);
    }
  }, [signerName]);

  // Canvas drawing setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;
  }, [penColor, mode]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange({ type: 'drawn', data: '', isValid: false });
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return { x: 0, y: 0 };
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange({
      type: 'drawn',
      data: dataUrl,
      isValid: hasDrawn,
    });
  };

  // When switching modes or typing
  useEffect(() => {
    if (mode === 'type') {
      const isValid = typedText.trim().length >= 2;
      onSignatureChange({
        type: 'typed',
        data: typedText.trim(),
        isValid,
      });
    } else {
      const canvas = canvasRef.current;
      const dataUrl = canvas && hasDrawn ? canvas.toDataURL('image/png') : '';
      onSignatureChange({
        type: 'drawn',
        data: dataUrl,
        isValid: hasDrawn,
      });
    }
  }, [mode, typedText, hasDrawn]);

  return (
    <div className="space-y-3">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'draw'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PenTool className="h-3.5 w-3.5 text-primary" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'type'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Type className="h-3.5 w-3.5 text-primary" />
            Type Name
          </button>
        </div>

        {mode === 'draw' && (
          <div className="flex items-center gap-2">
            {/* Pen Ink Selector */}
            <div className="flex items-center gap-1 mr-2 bg-muted/40 p-1 rounded-md">
              <button
                type="button"
                onClick={() => setPenColor('#1e40af')}
                className={`w-5 h-5 rounded-full bg-blue-700 transition-transform ${
                  penColor === '#1e40af' ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70'
                }`}
                title="Blue Executive Ink"
              />
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-5 h-5 rounded-full bg-slate-900 transition-transform ${
                  penColor === '#0f172a' ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70'
                }`}
                title="Classic Black Ink"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Signature Area */}
      {mode === 'draw' ? (
        <div className="relative rounded-xl border-2 border-dashed border-border bg-slate-50 dark:bg-slate-900/60 overflow-hidden group">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-36 cursor-crosshair touch-none"
          />

          {/* Dotted Signing Baseline */}
          <div className="pointer-events-none absolute bottom-8 left-6 right-6 flex items-center justify-between border-b border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 pb-1">
              <span className="text-destructive font-bold">✕</span> Sign above line
            </span>
            <span className="pb-1 uppercase tracking-wider text-[9px] font-mono">
              Legally Binding E-Signature
            </span>
          </div>

          {!hasDrawn && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60 gap-1">
              <Edit3 className="h-6 w-6 stroke-1" />
              <p className="text-xs font-medium">Use your mouse, finger, or stylus to sign here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl border border-border bg-slate-50 dark:bg-slate-900/60 p-4">
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="Type your legal full name"
              className="w-full bg-transparent border-0 border-b-2 border-primary/40 focus:border-primary focus:ring-0 text-xl font-medium text-foreground pb-2 placeholder:text-muted-foreground/50 focus:outline-none"
            />

            {/* Cursive Signature Preview */}
            {typedText.trim() && (
              <div className="mt-4 pt-3 border-t border-border/50 flex flex-col justify-center items-center py-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono self-start mb-1">
                  Rendered Digital E-Signature Preview:
                </span>
                <p
                  className={`text-3xl text-blue-600 dark:text-blue-400 select-none py-2 px-6 rounded-lg ${
                    typedFont === 'cursive-1'
                      ? 'font-serif italic tracking-wide'
                      : typedFont === 'cursive-2'
                        ? 'font-mono italic'
                        : 'font-sans italic tracking-wider'
                  }`}
                  style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive, serif" }}
                >
                  {typedText}
                </p>
                <div className="w-full flex items-center justify-between text-[10px] text-muted-foreground border-t border-dashed border-muted-foreground/20 pt-1 mt-1">
                  <span>Signatory: {typedText}</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Valid Digital Representation
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
