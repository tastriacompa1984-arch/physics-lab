"use client";
import React, { useEffect, useRef } from 'react';
import { drawGrid, drawLabel, getEventCoords } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

export const ConvexLens: React.FC<SimProps> = ({
  isGridVisible,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingCandleRef = useRef<boolean>(false);

  // Read parameters
  const f_param = parameters.f ?? 10; // Focal length (5 to 20 cm)
  const u_param = parameters.u ?? 22; // Object distance (1 to 50 cm)

  // Scale: 1 cm = 8 pixels
  const scale = 7;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2; // Lens center X
      const cy = h / 2; // Optical axis Y

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // 2. Optical Bench & Axis
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, cy);
      ctx.lineTo(w - 10, cy);
      ctx.stroke();

      // Bench base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, h - 25, w - 20, 10);

      // 3. Draw Lens
      ctx.strokeStyle = '#38bdf8'; // Cyan lens
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 110);
      ctx.lineTo(cx, cy + 110);
      ctx.stroke();

      // Lens arrowheads (convex double arrows)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      // Top arrowhead
      ctx.moveTo(cx, cy - 110);
      ctx.lineTo(cx - 8, cy - 100);
      ctx.lineTo(cx + 8, cy - 100);
      ctx.closePath();
      // Bottom arrowhead
      ctx.moveTo(cx, cy + 110);
      ctx.lineTo(cx - 8, cy + 100);
      ctx.lineTo(cx + 8, cy + 100);
      ctx.closePath();
      ctx.fill();

      // Lens center label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.fillText('O', cx - 15, cy - 15);

      // 4. Draw Focal Points F and 2F on both sides
      const f_px = f_param * scale;
      const fPoints = [
        { label: 'F', x: cx - f_px, side: 'left' },
        { label: '2F', x: cx - f_px * 2, side: 'left' },
        { label: "F'", x: cx + f_px, side: 'right' },
        { label: "2F'", x: cx + f_px * 2, side: 'right' }
      ];

      fPoints.forEach(fp => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(fp.x, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '10px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.fillText(fp.label, fp.x, cy + 15);
      });

      // 5. Draw Object (Candle)
      const u_px = u_param * scale;
      const candleX = cx - u_px;
      const candleHeight = 45;
      const candleY = cy - candleHeight;

      // Draw candle base and body
      ctx.fillStyle = '#ef4444'; // Red candle
      ctx.fillRect(candleX - 6, candleY, 12, candleHeight);
      
      // Wick
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(candleX, candleY);
      ctx.lineTo(candleX, candleY - 6);
      ctx.stroke();

      // Flame (Flickering effect using random sizing)
      const flameSize = 8 + Math.random() * 3;
      ctx.fillStyle = '#f97316'; // Orange flame
      ctx.beginPath();
      ctx.moveTo(candleX, candleY - 6);
      ctx.quadraticCurveTo(candleX - 5, candleY - 12, candleX, candleY - 6 - flameSize);
      ctx.quadraticCurveTo(candleX + 5, candleY - 12, candleX, candleY - 6);
      ctx.closePath();
      ctx.fill();

      // Highlight drag area on candle
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(candleX, cy - candleHeight / 2, 12, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Ray Tracing and Image Calculations
      // 1/u + 1/v = 1/f => v = uf / (u - f)
      const u = u_param;
      const f = f_param;
      const tipX = candleX;
      const tipY = candleY - 6; // Tip of the flame

      let v = 0;
      let isRealImage = true;
      let noImage = false;

      if (Math.abs(u - f) < 0.1) {
        noImage = true;
      } else {
        v = (u * f) / (u - f);
        isRealImage = u > f;
      }

      if (noImage) {
        // Parallel rays
        // Ray 1: Parallel to axis, hits lens, goes through focal point F'
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx, tipY);
        ctx.lineTo(cx + 180, tipY + (tipY - cy) * 1.8); // passes through F' roughly
        ctx.stroke();

        // Ray 2: Through optical center O
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx + 180, cy + (cy - tipY) * 1.0);
        ctx.stroke();

        drawLabel(ctx, '焦距处，平行光不成像', w / 2 - 80, 20, '12px var(--font-sans)', 'var(--text-primary)');
      } else if (isRealImage) {
        // REAL IMAGE formed on right side
        const v_px = v * scale;
        const imageX = cx + v_px;
        // Magnification M = -v/u
        const M = -v / u;
        const imageH = candleHeight * Math.abs(M);
        const imageY = cy + imageH; // positive is down (inverted)
        const imageTipY = cy + (candleHeight + 6) * Math.abs(M);

        // Draw Inverted Image Candle
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Semitransparent real image
        ctx.fillRect(imageX - 6 * Math.abs(M), cy, 12 * Math.abs(M), imageH);
        
        // Flame of image
        ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.beginPath();
        ctx.moveTo(imageX, imageTipY);
        ctx.quadraticCurveTo(imageX - 5 * Math.abs(M), cy + (candleHeight + 12) * Math.abs(M), imageX, cy + (candleHeight + 6) * Math.abs(M));
        ctx.quadraticCurveTo(imageX + 5 * Math.abs(M), cy + (candleHeight + 12) * Math.abs(M), imageX, imageTipY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Trace rays
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.65)'; // Green trace rays
        ctx.lineWidth = 1.5;

        // Ray 1: Parallel to lens, then through focal point F' to image tip
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx, tipY);
        ctx.lineTo(imageX, imageTipY);
        ctx.stroke();

        // Ray 2: Direct line through optical center O
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(imageX, imageTipY);
        ctx.stroke();

        // Ray 3: Through left focal point F, hits lens, goes parallel
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx, imageTipY);
        ctx.lineTo(imageX, imageTipY);
        ctx.stroke();

        // Render descriptors
        const sizeDesc = u > 2 * f ? '倒立、缩小的实像' : u === 2 * f ? '倒立、等大的实像' : '倒立、放大的实像';
        drawLabel(ctx, `成像性质: ${sizeDesc}`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
        drawLabel(ctx, `像距 v = ${v.toFixed(1)} cm`, 20, 50, '12px var(--font-sans)', 'var(--text-primary)');

      } else {
        // VIRTUAL IMAGE formed on left side
        const v_px = Math.abs(v) * scale;
        const imageX = cx - v_px;
        const M = Math.abs(v) / u;
        const imageH = candleHeight * M;
        const imageY = cy - imageH;
        const imageTipY = cy - (candleHeight + 6) * M;

        // Draw Upright, magnified, dashed Virtual Image
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; // Semitransparent cyan
        ctx.fillRect(imageX - 6 * M, imageY, 12 * M, imageH);
        
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(imageX - 6 * M, imageY, 12 * M, imageH);

        // Flame of virtual image
        ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
        ctx.beginPath();
        ctx.moveTo(imageX, imageTipY);
        ctx.quadraticCurveTo(imageX - 5 * M, cy - (candleHeight + 12) * M, imageX, cy - (candleHeight + 6) * M);
        ctx.quadraticCurveTo(imageX + 5 * M, cy - (candleHeight + 12) * M, imageX, imageTipY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Trace rays
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
        ctx.lineWidth = 1.5;

        // Ray 1: Parallel to lens, then bends right. Virtual extension goes left.
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx, tipY);
        ctx.lineTo(cx + 120, tipY + (tipY - cy) * 0.9); // Real refracted path
        ctx.stroke();

        // Ray 1 extension (virtual)
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx, tipY);
        ctx.lineTo(imageX, imageTipY);
        ctx.stroke();
        ctx.restore();

        // Ray 2: Direct line through optical center O, continues right. Extension goes left.
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx + 120, cy + (cy - tipY) * 1.5);
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(imageX, imageTipY);
        ctx.stroke();
        ctx.restore();

        // Render descriptors
        drawLabel(ctx, '成像性质: 正立、放大的虚像', 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
        drawLabel(ctx, `虚像距 |v| = ${Math.abs(v).toFixed(1)} cm`, 20, 50, '12px var(--font-sans)', 'var(--text-primary)');
      }

      // Draw parameter guides on optical bench
      drawLabel(ctx, `物距 u = ${u_param.toFixed(1)} cm`, candleX - 30, h - 50, '11px var(--font-sans)', '#f8fafc');

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Unified handlers to support dragging the candle
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const cx = canvas.width / 2;

      const candleX = cx - u_param * scale;
      // Check if click is near the candle X coordinate
      if (Math.abs(mx - candleX) < 30) {
        isDraggingCandleRef.current = true;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingCandleRef.current) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const cx = canvas.width / 2;

      // Calculate object distance u relative to lens position cx
      const u_px = cx - mx;
      let u = u_px / scale;

      // Clamp u between 1 and 50 cm
      if (u < 1) u = 1;
      if (u > 50) u = 50;

      // Trigger parameter updates back to react container
      onRecordData({ u });
    };

    const handleEnd = () => {
      isDraggingCandleRef.current = false;
    };

    canvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [f_param, u_param, isGridVisible]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
