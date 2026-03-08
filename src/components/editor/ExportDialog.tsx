import React, { useState } from 'react';
import { X, Download, Film, Image, FileImage, Layers } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  totalFrames: number;
  fps: number;
  width: number;
  height: number;
  renderFrame: (frame: number) => void;
}

type ExportFormat = 'webm' | 'gif' | 'spritesheet' | 'frames';

export default function ExportDialog({ open, onClose, canvasRef, totalFrames, fps, width, height, renderFrame }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('webm');
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!open) return null;

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);

    try {
      if (format === 'webm') {
        await exportWebM();
      } else if (format === 'spritesheet') {
        await exportSpritesheet();
      } else if (format === 'frames') {
        await exportFrames();
      }
    } catch (e) {
      console.error('Export failed:', e);
    }

    setExporting(false);
  };

  const captureFrames = async (): Promise<HTMLCanvasElement[]> => {
    const frames: HTMLCanvasElement[] = [];
    for (let i = 0; i < totalFrames; i++) {
      renderFrame(i);
      const sourceCanvas = canvasRef.current;
      if (!sourceCanvas) continue;
      const frame = document.createElement('canvas');
      frame.width = width * scale;
      frame.height = height * scale;
      const ctx = frame.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      if (!transparent) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, frame.width, frame.height);
      }
      ctx.drawImage(sourceCanvas, 0, 0, frame.width, frame.height);
      frames.push(frame);
      setProgress((i + 1) / totalFrames * 100);
    }
    return frames;
  };

  const exportWebM = async () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width * scale;
    exportCanvas.height = height * scale;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const stream = exportCanvas.captureStream(0);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);

    return new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixelvfx-export.webm';
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      };

      recorder.start();
      let frame = 0;
      const interval = setInterval(() => {
        if (frame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
          return;
        }
        renderFrame(frame);
        const sourceCanvas = canvasRef.current;
        if (sourceCanvas) {
          if (!transparent) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
          } else {
            ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
          }
          ctx.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
          (stream.getVideoTracks()[0] as any).requestFrame?.();
        }
        setProgress((frame + 1) / totalFrames * 100);
        frame++;
      }, 1000 / fps);
    });
  };

  const exportSpritesheet = async () => {
    const frames = await captureFrames();
    const cols = Math.ceil(Math.sqrt(frames.length));
    const rows = Math.ceil(frames.length / cols);
    const sheet = document.createElement('canvas');
    sheet.width = cols * width * scale;
    sheet.height = rows * height * scale;
    const ctx = sheet.getContext('2d')!;

    frames.forEach((frame, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.drawImage(frame, col * width * scale, row * height * scale);
    });

    sheet.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pixelvfx-spritesheet.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportFrames = async () => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const frames = await captureFrames();

    for (let i = 0; i < frames.length; i++) {
      const dataUrl = frames[i].toDataURL('image/png');
      const data = dataUrl.split(',')[1];
      zip.file(`frame_${String(i).padStart(4, '0')}.png`, data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixelvfx-frames.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formats: { id: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'webm', label: 'Video (WebM)', icon: <Film size={16} />, desc: 'Animated video file' },
    { id: 'spritesheet', label: 'Spritesheet', icon: <Layers size={16} />, desc: 'All frames in a grid' },
    { id: 'frames', label: 'Frame Sequence', icon: <FileImage size={16} />, desc: 'ZIP of PNG frames' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg w-[400px] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Export</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Format selection */}
          <div className="grid grid-cols-3 gap-2">
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-md border transition-all ${
                  format === f.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {f.icon}
                <span className="text-[10px] font-medium">{f.label}</span>
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Scale</span>
              <div className="flex gap-1">
                {[1, 2, 4, 8].map(s => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-2 py-0.5 text-[11px] rounded ${
                      scale === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transparent BG</span>
              <input
                type="checkbox"
                checked={transparent}
                onChange={e => setTransparent(e.target.checked)}
                className="accent-primary"
              />
            </div>

            <div className="text-[10px] text-muted-foreground">
              Output: {width * scale}×{height * scale}px • {totalFrames} frames @ {fps}fps
            </div>
          </div>

          {/* Progress */}
          {exporting && (
            <div className="space-y-1">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%`, background: 'hsl(200, 80%, 55%)' }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
