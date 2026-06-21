"use client";
import React, { useEffect, useRef } from 'react';
import { drawGrid, drawArrow, drawLabel, getEventCoords } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

export const ForceComposition: React.FC<SimProps> = ({
  isGridVisible,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const F1 = parameters.F1 ?? 50;         // Force 1 magnitude (0 to 100 N)
  const theta1_deg = parameters.theta1 ?? 30; // Force 1 angle degrees (0 to 360)
  const F2 = parameters.F2 ?? 60;         // Force 2 magnitude (0 to 100 N)
  const theta2_deg = parameters.theta2 ?? 120; // Force 2 angle degrees (0 to 360)

  // Dragging states
  const dragTargetRef = useRef<'F1' | 'F2' | null>(null);

  // Scale: 1 N = 1.3 pixels
  const scale = 1.3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = 170; // Pivot Center X
      const cy = 180; // Pivot Center Y

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Draw protractor circular guides
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 50 * scale, 0, Math.PI * 2);
      ctx.arc(cx, cy, 100 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Horizontal reference axis
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 130, cy);
      ctx.lineTo(cx + 130, cy);
      ctx.moveTo(cx, cy - 130);
      ctx.lineTo(cx, cy + 130);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Calculations
      const rad1 = (theta1_deg * Math.PI) / 180;
      const rad2 = (theta2_deg * Math.PI) / 180;

      // Force 1 vector coordinates (Y axis is inverted in screen coordinates, so sin is subtracted!)
      const f1x = cx + F1 * Math.cos(rad1) * scale;
      const f1y = cy - F1 * Math.sin(rad1) * scale;

      // Force 2 vector coordinates
      const f2x = cx + F2 * Math.cos(rad2) * scale;
      const f2y = cy - F2 * Math.sin(rad2) * scale;

      // Net resultant force components
      const netFx = F1 * Math.cos(rad1) + F2 * Math.cos(rad2);
      const netFy = F1 * Math.sin(rad1) + F2 * Math.sin(rad2);

      const Fnet = Math.sqrt(netFx * netFx + netFy * netFy);
      const thetaNet_rad = Math.atan2(netFy, netFx);
      const thetaNet_deg = (thetaNet_rad * 180) / Math.PI;
      const adjustedThetaNet = thetaNet_deg < 0 ? thetaNet_deg + 360 : thetaNet_deg;

      // Net force vector coordinates
      const fnetx = cx + netFx * scale;
      const fnety = cy - netFy * scale;

      // 3. Draw Parallelogram dashed lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      // From F1 tip to Fnet tip
      ctx.moveTo(f1x, f1y);
      ctx.lineTo(fnetx, fnety);
      // From F2 tip to Fnet tip
      ctx.moveTo(f2x, f2y);
      ctx.lineTo(fnetx, fnety);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Draw Vectors
      // Force 1 (Blue)
      drawArrow(ctx, cx, cy, f1x, f1y, '#3b82f6', 2.5, 8);
      // Force 2 (Orange)
      drawArrow(ctx, cx, cy, f2x, f2y, '#fb923c', 2.5, 8);
      // Resultant Force Fnet (Thick Red)
      if (Fnet > 1) {
        drawArrow(ctx, cx, cy, fnetx, fnety, '#f43f5e', 3.5, 10);
      }

      // Draw center pivot core
      ctx.fillStyle = 'var(--text-primary)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Vector labels at tips
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 11px var(--font-sans)';
      ctx.fillText('F₁', f1x + 8, f1y - 8);

      ctx.fillStyle = '#fb923c';
      ctx.fillText('F₂', f2x + 8, f2y - 8);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText('F合', fnetx + 10, fnety + 12);

      // Drag circles on arrowheads
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(f1x, f1y, 10, 0, Math.PI * 2);
      ctx.arc(f2x, f2y, 10, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Draw Component Breakdown panel (Right side)
      const textX = 350;
      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.textAlign = 'left';
      
      ctx.fillText('【力的正交分解】', textX, 40);
      
      ctx.font = '11px var(--font-mono)';
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`F₁ₓ = F₁·cosθ₁ = ${(F1 * Math.cos(rad1)).toFixed(1)} N`, textX, 68);
      ctx.fillText(`F₁y = F₁·sinθ₁ = ${(F1 * Math.sin(rad1)).toFixed(1)} N`, textX, 86);

      ctx.fillStyle = '#fb923c';
      ctx.fillText(`F₂ₓ = F₂·cosθ₂ = ${(F2 * Math.cos(rad2)).toFixed(1)} N`, textX, 114);
      ctx.fillText(`F₂y = F₂·sinθ₂ = ${(F2 * Math.sin(rad2)).toFixed(1)} N`, textX, 132);

      ctx.strokeStyle = 'var(--border-color)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(textX, 150);
      ctx.lineTo(w - 20, 150);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`F合x = F₁ₓ + F₂ₓ = ${netFx.toFixed(1)} N`, textX, 172);
      ctx.fillText(`F合y = F₁y + F₂y = ${netFy.toFixed(1)} N`, textX, 190);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.fillText(`F合 = √(F合x² + F合y²) = ${Fnet.toFixed(1)} N`, textX, 222);
      ctx.fillText(`合力角度 θ = ${adjustedThetaNet.toFixed(1)}°`, textX, 244);

      // Simple instructions
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('提示: 可在左侧直接拖动 F₁ 和 F₂ 的箭头', textX, h - 30);

      // On screen labels
      drawLabel(ctx, `分力 F₁: ${F1.toFixed(0)} N, ${theta1_deg.toFixed(0)}°`, 20, 20, '11px var(--font-sans)', '#3b82f6');
      drawLabel(ctx, `分力 F₂: ${F2.toFixed(0)} N, ${theta2_deg.toFixed(0)}°`, 180, 20, '11px var(--font-sans)', '#fb923c');

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Unified handlers to support dragging vector tips directly on the graph
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      const cx = 170;
      const cy = 180;

      const rad1 = (theta1_deg * Math.PI) / 180;
      const rad2 = (theta2_deg * Math.PI) / 180;

      const f1x = cx + F1 * Math.cos(rad1) * scale;
      const f1y = cy - F1 * Math.sin(rad1) * scale;

      const f2x = cx + F2 * Math.cos(rad2) * scale;
      const f2y = cy - F2 * Math.sin(rad2) * scale;

      const dist1 = Math.sqrt((mx - f1x) * (mx - f1x) + (my - f1y) * (my - f1y));
      if (dist1 < 20) {
        dragTargetRef.current = 'F1';
        return;
      }

      const dist2 = Math.sqrt((mx - f2x) * (mx - f2x) + (my - f2y) * (my - f2y));
      if (dist2 < 20) {
        dragTargetRef.current = 'F2';
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const target = dragTargetRef.current;
      if (!target) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      const cx = 170;
      const cy = 180;

      // Calculate vector relative to pivot (cx, cy)
      const dx = mx - cx;
      const dy = cy - my; // vertical Y is inverted on screen

      // Calculate magnitude and angle
      let forceVal = Math.sqrt(dx*dx + dy*dy) / scale;
      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI;
      if (deg < 0) deg += 360;

      // Clamp force value between 0 and 100 N
      if (forceVal < 0) forceVal = 0;
      if (forceVal > 100) forceVal = 100;

      // Trigger parameter updates back to react container
      if (target === 'F1') {
        onRecordData({ F1: forceVal, theta1: deg });
      } else {
        onRecordData({ F2: forceVal, theta2: deg });
      }
    };

    const handleEnd = () => {
      dragTargetRef.current = null;
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
  }, [F1, theta1_deg, F2, theta2_deg, isGridVisible]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
