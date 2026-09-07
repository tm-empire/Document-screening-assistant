import React, { useState, useRef, useEffect } from 'react';
import { Eye, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export const ElaCanvas = ({ imageSrc, suspiciousRegions = [], tamperingScore = 0.12 }) => {
  const [viewMode, setViewMode] = useState('ELA_HEATMAP'); // 'ORIGINAL', 'ELA_HEATMAP', 'OVERLAY'
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width = 400;
    const height = canvas.height = 240;

    // Draw base card mock scan
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Draw document frame
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Draw Header text representation
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText("IDENTITY CARD / REPUBLIC REGISTRY", 30, 35);

    // Draw Photo Box
    ctx.fillStyle = '#334155';
    ctx.fillRect(30, 50, 100, 120);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText("SUBJECT PHOTO", 40, 115);

    // Draw Details fields lines
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText("NAME: ELEANOR VANCE", 145, 65);
    ctx.fillText("DOB:  1992-04-14", 145, 90);
    ctx.fillText("DOC#: DOC-9988221", 145, 115);
    ctx.fillText("ISSUE: 2020-01-10", 145, 140);
    ctx.fillText("EXPIRY: 2030-01-10", 145, 165);

    if (viewMode === 'ELA_HEATMAP' || viewMode === 'OVERLAY') {
      // Create Error Level Analysis High-Frequency Heatmap effect
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;

      for (let i = 0; i < pixels.length; i += 4) {
        // High-pass filter noise
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = avg * 0.4;     // R
        pixels[i + 1] = avg * 0.8; // G
        pixels[i + 2] = avg * 1.2; // B
      }

      ctx.putImageData(imgData, 0, 0);

      // Highlight suspicious regions if present
      if (suspiciousRegions.length > 0) {
        suspiciousRegions.forEach(reg => {
          // Heatmap anomaly pulse glow
          ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.fillRect(reg.x, reg.y, reg.width, reg.height);
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(reg.x, reg.y, reg.width, reg.height);
          ctx.setLineDash([]);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.fillText(reg.label, reg.x, reg.y - 4);
        });
      } else if (tamperingScore > 0.60) {
        // Fallback default suspicious photo box
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.fillRect(30, 50, 100, 120);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 50, 100, 120);
      }
    }
  }, [viewMode, tamperingScore, suspiciousRegions]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Layer 3 Forensics — ELA Viewer
          </h4>
        </div>

        {/* View Mode Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setViewMode('ORIGINAL')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              viewMode === 'ORIGINAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('ELA_HEATMAP')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              viewMode === 'ELA_HEATMAP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ELA Heatmap
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex justify-center p-2">
        <canvas ref={canvasRef} className="max-w-full h-auto rounded shadow-inner" />
        
        {tamperingScore > 0.60 && (
          <div className="absolute top-4 right-4 bg-rose-950/90 border border-rose-500/50 text-rose-200 px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-md">
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>ELA Anomaly Detected ({Math.round(tamperingScore * 100)}%)</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
        {viewMode === 'ELA_HEATMAP' 
          ? "Error Level Analysis re-saves image at a set compression level to expose localized quantization noise differences." 
          : "Standard RGB optical scan inspection view."}
      </p>
    </div>
  );
};
