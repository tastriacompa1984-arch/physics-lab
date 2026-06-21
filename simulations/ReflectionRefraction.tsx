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

export const ReflectionRefraction: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const theta_i_deg = parameters.incidentAngle ?? 45; // Degrees (-85 to 85)
  const n1 = parameters.n1 ?? 1.0;                  // Upper index
  const n2 = parameters.n2 ?? 1.5;                  // Lower index

  // Drag laser pointer state
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // 2. Draw medium backgrounds
      // Upper medium (n1)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(0, 0, w, cy);
      
      // Lower medium (n2)
      ctx.fillStyle = `rgba(139, 92, 246, ${Math.min(0.05 + (n2 - 1) * 0.1, 0.35)})`; // Gets bluer/denser as n2 increases
      ctx.fillRect(0, cy, w, cy);

      // Medium boundary
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Normal line (Normal axis)
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 15);
      ctx.lineTo(cx, h - 15);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // 3. Draw protractor guidelines
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.stroke();

      // Protractor ticks every 10 degrees
      ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.font = '9px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let angle = 0; angle < 360; angle += 10) {
        const rad = (angle * Math.PI) / 180;
        const startR = 136;
        const endR = 140;
        const sx = cx + Math.cos(rad) * startR;
        const sy = cy + Math.sin(rad) * startR;
        const ex = cx + Math.cos(rad) * endR;
        const ey = cy + Math.sin(rad) * endR;
        
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Print tick numbers for key angles
        if (angle % 30 === 0 && angle !== 0 && angle !== 180) {
          const textR = 122;
          const tx = cx + Math.cos(rad) * textR;
          const ty = cy + Math.sin(rad) * textR;
          // Normalize angle reading from normal (0 in vertical)
          let degLabel = 0;
          if (angle <= 90) degLabel = 90 - angle;
          else if (angle <= 180) degLabel = angle - 90;
          else if (angle <= 270) degLabel = 270 - angle;
          else degLabel = angle - 270;
          
          ctx.fillText(`${degLabel}°`, tx, ty);
        }
      }

      // 4. Calculations for Light Rays
      // Incident angle in radians (theta_i)
      // Positive/negative maps to left/right of normal
      const theta_i = (theta_i_deg * Math.PI) / 180;

      // Laser position (pointing to center)
      const laserRadius = 160;
      const laserX = cx - Math.sin(theta_i) * laserRadius;
      const laserY = cy - Math.cos(theta_i) * laserRadius;

      // Draw Laser pointer case
      ctx.save();
      ctx.translate(laserX, laserY);
      ctx.rotate(theta_i);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -24, 24, 48, 4);
      ctx.fill();
      ctx.stroke();
      
      // Brass nozzle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, 20, 12, 8);
      ctx.restore();

      // Light beam styling
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#22c55e'; // Green laser light
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;

      // A. Draw Incident Ray (Laser to center)
      ctx.beginPath();
      ctx.moveTo(laserX, laserY);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // B. Draw Reflected Ray
      // Reflection angle equals incident angle
      const reflectedRad = Math.PI/2 - (Math.PI/2 - theta_i); // Reflects across normal
      const reflectedX = cx + Math.sin(theta_i) * laserRadius;
      const reflectedY = cy - Math.cos(theta_i) * laserRadius;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(reflectedX, reflectedY);
      ctx.stroke();

      // C. Draw Refracted Ray (Snell's Law)
      // n1 * sin(theta_i) = n2 * sin(theta_t)
      // sin(theta_t) = (n1 / n2) * sin(theta_i)
      const sin_theta_t = (n1 / n2) * Math.sin(theta_i);
      const isTotalInternalReflection = Math.abs(sin_theta_t) > 1.0;

      let theta_t_deg = 0;

      if (isTotalInternalReflection) {
        // Total internal reflection: No refraction. Glow the reflected ray brighter!
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(reflectedX, reflectedY);
        ctx.stroke();
      } else {
        // Draw normal refracted ray
        const theta_t = Math.asin(sin_theta_t);
        theta_t_deg = (theta_t * 180) / Math.PI;

        const refractRadius = 160;
        const refractX = cx + Math.sin(theta_t) * refractRadius;
        const refractY = cy + Math.cos(theta_t) * refractRadius;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(refractX, refractY);
        ctx.stroke();
      }

      ctx.restore(); // Reset shadow/glow

      // 5. Draw Angle Arcs (Arcs showing angle values)
      ctx.save();
      ctx.lineWidth = 1;
      
      // Incident angle arc (between ray and normal line)
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      const startArcAngle = -Math.PI / 2; // Normal line pointing up
      const endArcAngle = -Math.PI / 2 - theta_i;
      // Draw arc in correct direction
      ctx.arc(cx, cy, 40, startArcAngle, endArcAngle, theta_i > 0);
      ctx.stroke();

      // Refracted angle arc
      if (!isTotalInternalReflection) {
        ctx.strokeStyle = '#eab308';
        ctx.beginPath();
        const startRefractArc = Math.PI / 2; // Normal line pointing down
        const theta_t = Math.asin(sin_theta_t);
        ctx.arc(cx, cy, 40, startRefractArc, startRefractArc + theta_t, theta_t < 0);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Draw Text Readouts
      drawLabel(ctx, `介质 1 (上): n₁ = ${n1.toFixed(2)}`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `介质 2 (下): n₂ = ${n2.toFixed(2)}`, 20, 50, '12px var(--font-sans)', 'var(--text-primary)');

      drawLabel(ctx, `入射角 θ₁: ${Math.abs(theta_i_deg).toFixed(1)}°`, 20, cy - 35, '12px var(--font-sans)', '#ef4444');
      drawLabel(ctx, `反射角 θ_r: ${Math.abs(theta_i_deg).toFixed(1)}°`, w - 140, cy - 35, '12px var(--font-sans)', '#22c55e');

      if (isTotalInternalReflection) {
        drawLabel(ctx, `发生全反射 (Total Reflection)`, w - 210, cy + 15, '12px var(--font-sans)', '#f43f5e');
      } else {
        drawLabel(ctx, `折射角 θ₂: ${Math.abs(theta_t_deg).toFixed(1)}°`, w - 140, cy + 15, '12px var(--font-sans)', '#eab308');
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Check laser click helper
    const checkLaserClick = (mx: number, my: number) => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const theta_i = (theta_i_deg * Math.PI) / 180;
      const lx = cx - Math.sin(theta_i) * 160;
      const ly = cy - Math.cos(theta_i) * 160;

      const dist = Math.sqrt((mx - lx) * (mx - lx) + (my - ly) * (my - ly));
      if (dist < 40) {
        isDraggingRef.current = true;
      }
    };

    // Unified handlers to support dragging the laser pointer directly on the screen
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Only allow dragging in upper half (where laser is located)
      if (my < canvas.height / 2) {
        checkLaserClick(mx, my);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Center coordinates
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Calculate angle from center (dx, dy)
      const dx = cx - mx;
      const dy = cy - my; // vertical normal points UP, so dy > 0

      let rad = Math.atan2(dx, dy); // angle relative to vertical normal
      let deg = (rad * 180) / Math.PI;

      // Clamp angle between -85 and 85
      if (deg < -85) deg = -85;
      if (deg > 85) deg = 85;

      // Trigger parameter updates back to react container
      onRecordData({ incidentAngle: deg });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
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
  }, [theta_i_deg, n1, n2, isGridVisible]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
