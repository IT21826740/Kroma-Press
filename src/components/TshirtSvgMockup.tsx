import type React from 'react';
import {useRef, useState} from 'react';
import type {
  CustomArtworkLayer,
  CustomTextLayer,
  GarmentColor,
  PlacementSide,
} from '../shared/types';

interface TshirtSvgMockupProps {
  color: GarmentColor;
  side: PlacementSide;
  artwork?: CustomArtworkLayer;
  textLayer?: CustomTextLayer;
  showPrintGuides?: boolean;
  interactiveDrag?: boolean;
  onMoveArtwork?: (x: number, y: number) => void;
  onMoveText?: (x: number, y: number) => void;
  activeLayer?: 'artwork' | 'text';
  className?: string;
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

export function TshirtSvgMockup({
  color,
  side,
  artwork,
  textLayer,
  showPrintGuides = false,
  interactiveDrag = false,
  onMoveArtwork,
  onMoveText,
  activeLayer = 'artwork',
  className = '',
}: TshirtSvgMockupProps) {
  const printZoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'artwork' | 'text' | null>(null);
  const dark = isDarkHex(color.hex);
  const strokeColor = dark ? 'rgba(255,255,255,0.16)' : 'rgba(9,9,11,0.14)';
  const shadowOpacity = dark ? 0.34 : 0.14;

  const updatePointerPos = (
    clientX: number,
    clientY: number,
    target: 'artwork' | 'text',
  ) => {
    const el = printZoneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(8, Math.min(92, ((clientY - rect.top) / rect.height) * 100));
    if (target === 'artwork' && onMoveArtwork) {
      onMoveArtwork(Math.round(xPct), Math.round(yPct));
    } else if (target === 'text' && onMoveText) {
      onMoveText(Math.round(xPct), Math.round(yPct));
    }
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    target: 'artwork' | 'text',
  ) => {
    if (!interactiveDrag) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(target);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !interactiveDrag) return;
    updatePointerPos(e.clientX, e.clientY, dragging);
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const fontClass =
    textLayer?.font === 'mono'
      ? 'font-mono'
      : textLayer?.font === 'serif'
        ? 'font-serif'
        : 'font-display';

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="relative w-full max-w-[440px] aspect-[4/4.3]">
        {/* Realistic Vector Garment Silhouette */}
        <svg
          viewBox="0 0 400 430"
          className="w-full h-full drop-shadow-[0_18px_32px_rgba(9,9,11,0.12)]"
          aria-label={`${color.name} t-shirt ${side} view`}
        >
          <defs>
            <linearGradient id={`fabric-shade-${side}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={dark ? 0.08 : 0.25} />
              <stop offset="50%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity={shadowOpacity} />
            </linearGradient>
            <linearGradient id={`fold-left-${side}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#000000" stopOpacity={dark ? 0.25 : 0.09} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`fold-right-${side}`} x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#000000" stopOpacity={dark ? 0.28 : 0.1} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Tee Body & Sleeves */}
          <path
            d={
              side === 'front'
                ? 'M148 34 C168 58 232 58 252 34 L302 48 L382 128 L334 176 L296 140 L296 394 C296 399 292 402 287 402 L113 402 C108 402 104 399 104 394 L104 140 L66 176 L18 128 L98 48 Z'
                : 'M148 34 C172 43 228 43 252 34 L302 48 L382 128 L334 176 L296 140 L296 394 C296 399 292 402 287 402 L113 402 C108 402 104 399 104 394 L104 140 L66 176 L18 128 L98 48 Z'
            }
            fill={color.hex}
            stroke={strokeColor}
            strokeWidth="1.5"
          />

          {/* Subtle Side Volume & Fabric Shading */}
          <path
            d="M148 34 C168 58 232 58 252 34 L302 48 L382 128 L334 176 L296 140 L296 394 C296 399 292 402 287 402 L113 402 C108 402 104 399 104 394 L104 140 L66 176 L18 128 L98 48 Z"
            fill={`url(#fabric-shade-${side})`}
            pointerEvents="none"
          />

          {/* Left & Right Torso Seam Shadows */}
          <rect x="104" y="138" width="24" height="262" fill={`url(#fold-left-${side})`} pointerEvents="none" />
          <rect x="272" y="138" width="24" height="262" fill={`url(#fold-right-${side})`} pointerEvents="none" />

          {/* Collar Ribbing */}
          {side === 'front' ? (
            <>
              <path
                d="M144 35 C166 72 234 72 256 35 C235 48 165 48 144 35 Z"
                fill={dark ? '#09090B' : '#E4E4E7'}
                fillOpacity="0.45"
              />
              <path
                d="M140 37 C165 82 235 82 260 37"
                fill="none"
                stroke={strokeColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M143 37 C166 76 234 76 257 37"
                fill="none"
                stroke={color.hex}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Tear-away inner neck label hint */}
              <rect
                x="189"
                y="49"
                width="22"
                height="9"
                rx="1"
                fill={dark ? 'rgba(255,255,255,0.14)' : 'rgba(9,9,11,0.08)'}
              />
            </>
          ) : (
            <>
              <path
                d="M142 36 C168 53 232 53 258 36"
                fill="none"
                stroke={strokeColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M145 36 C169 49 231 49 255 36"
                fill="none"
                stroke={color.hex}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Drop-Shoulder & Hem Stitch Lines */}
          <path
            d="M98 48 L104 140 M302 48 L296 140"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <line
            x1="106"
            y1="392"
            x2="294"
            y2="392"
            stroke={strokeColor}
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <line
            x1="28"
            y1="118"
            x2="75"
            y2="165"
            stroke={strokeColor}
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <line
            x1="372"
            y1="118"
            x2="325"
            y2="165"
            stroke={strokeColor}
            strokeWidth="1"
            strokeDasharray="3 2"
          />
        </svg>

        {/* Interactive Printable Area Overlay */}
        <div
          ref={printZoneRef}
          className={`absolute left-[28.5%] right-[28.5%] top-[21%] bottom-[16%] overflow-hidden ${
            showPrintGuides
              ? dark
                ? 'border border-dashed border-white/35 bg-white/[0.02]'
                : 'border border-dashed border-zinc-900/30 bg-zinc-900/[0.02]'
              : ''
          }`}
        >
          {showPrintGuides && (
            <span
              className={`absolute top-1 left-1.5 text-[10px] font-mono tracking-tight pointer-events-none ${
                dark ? 'text-white/55' : 'text-zinc-600'
              }`}
            >
              12&quot; × 16&quot; PRINT ZONE
            </span>
          )}

          {/* Uploaded / Selected Artwork */}
          {artwork?.imageDataUrl && (
            <div
              onPointerDown={(e) => handlePointerDown(e, 'artwork')}
              style={{
                left: `${artwork.x}%`,
                top: `${artwork.y}%`,
                width: `${artwork.scale}%`,
                transform: `translate(-50%, -50%) rotate(${artwork.rotation}deg)`,
              }}
              className={`absolute select-none ${
                interactiveDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              } ${
                interactiveDrag && activeLayer === 'artwork' && showPrintGuides
                  ? 'ring-1 ring-[#E63918]/80'
                  : ''
              }`}
            >
              <img
                src={artwork.imageDataUrl}
                alt={artwork.fileName || 'Custom artwork'}
                draggable={false}
                className="w-full h-auto object-contain block pointer-events-none"
              />
            </div>
          )}

          {/* Custom Text Layer */}
          {textLayer?.text.trim() && (
            <div
              onPointerDown={(e) => handlePointerDown(e, 'text')}
              style={{
                left: `${textLayer.x}%`,
                top: `${textLayer.y}%`,
                color: textLayer.color,
                fontSize: `${textLayer.fontSize}px`,
                letterSpacing: `${textLayer.letterSpacing}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute text-center font-bold leading-tight whitespace-nowrap select-none ${fontClass} ${
                interactiveDrag ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              } ${
                interactiveDrag && activeLayer === 'text' && showPrintGuides
                  ? 'ring-1 ring-[#E63918]/80 px-1'
                  : ''
              }`}
            >
              {textLayer.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function renderDesignCompositePng(params: {
  colorHex: string;
  artwork?: CustomArtworkLayer;
  textLayer?: CustomTextLayer;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 516;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#F4F4F5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw crisp shirt silhouette scaled 1.2x from 400x430
  ctx.save();
  ctx.scale(1.2, 1.2);
  const path = new Path2D(
    'M148 34 C168 58 232 58 252 34 L302 48 L382 128 L334 176 L296 140 L296 394 C296 399 292 402 287 402 L113 402 C108 402 104 399 104 394 L104 140 L66 176 L18 128 L98 48 Z',
  );
  ctx.fillStyle = params.colorHex;
  ctx.fill(path);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke(path);
  ctx.restore();

  // Print zone bounds in 480x516 space:
  const zoneLeft = 480 * 0.285;
  const zoneTop = 516 * 0.21;
  const zoneW = 480 * (1 - 0.57);
  const zoneH = 516 * (1 - 0.37);

  if (params.artwork?.imageDataUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const targetW = zoneW * (params.artwork!.scale / 100);
        const ratio = img.naturalHeight / Math.max(1, img.naturalWidth);
        const targetH = targetW * ratio;
        const cx = zoneLeft + (zoneW * params.artwork!.x) / 100;
        const cy = zoneTop + (zoneH * params.artwork!.y) / 100;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((params.artwork!.rotation * Math.PI) / 180);
        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = params.artwork!.imageDataUrl!;
    });
  }

  if (params.textLayer?.text.trim()) {
    const cx = zoneLeft + (zoneW * params.textLayer.x) / 100;
    const cy = zoneTop + (zoneH * params.textLayer.y) / 100;
    ctx.save();
    ctx.fillStyle = params.textLayer.color;
    const fontFamily =
      params.textLayer.font === 'mono'
        ? 'monospace'
        : params.textLayer.font === 'serif'
          ? 'Georgia, serif'
          : 'sans-serif';
    ctx.font = `700 ${Math.round(params.textLayer.fontSize * 1.15)}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(params.textLayer.text, cx, cy);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
