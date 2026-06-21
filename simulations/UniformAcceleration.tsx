"use client";
import React, { useEffect, useRef } from 'react';
import { drawGrid, drawArrow, drawLabel } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

export const UniformAcceleration: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const v0 = parameters.v0 ?? 5.0; // Initial velocity m/s (-20 to 20)
  const accel = parameters.a ?? 1.5; // Acceleration m/s^2 (-10 to 10)

  // Simulation states
  const stateRef = useRef({
    time: 0,
    posX: 0, // meters (start at center, which is 0)
    velV: 0, // m/s
    history: [] as { t: number; x: number; v: number; a: number }[],
    isStopped: false,
    initialized: false
  });

  const resetState = () => {
    const s = stateRef.current;
    s.time = 0;
    s.posX = 0;
    s.velV = v0;
    s.history = [{ t: 0, x: 0, v: v0, a: accel }];
    s.isStopped = false;
    s.initialized = true;
  };

  // Reset when sliders update
  useEffect(() => {
    resetState();
  }, [v0, accel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const trackY = 130;
    const trackXStart = 30;
    const trackXEnd = 290;
    const trackWidth = trackXEnd - trackXStart;
    
    // Scale: 1m = 2.4 pixels. Track covers -50m to +50m range.
    // Center of track represents 0m.
    const scale = 2.4;
    const trackCenter = (trackXStart + trackXEnd) / 2;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dividerX = 310;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      const s = stateRef.current;
      if (!s.initialized) return;

      // 2. Physics calculation
      if (isPlaying && !s.isStopped) {
        const dt = 0.03 * simSpeed;
        s.time += dt;

        // Kinematics formulas
        s.velV = v0 + accel * s.time;
        s.posX = v0 * s.time + 0.5 * accel * s.time * s.time;

        // Boundaries checks (-50m to +50m)
        if (s.posX <= -50) {
          s.posX = -50;
          s.velV = 0;
          s.isStopped = true;
        } else if (s.posX >= 50) {
          s.posX = 50;
          s.velV = 0;
          s.isStopped = true;
        }

        // Add history point
        s.history.push({ t: s.time, x: s.posX, v: s.velV, a: accel });
      }

      // 3. Draw Track
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(trackXStart, trackY);
      ctx.lineTo(trackXEnd, trackY);
      ctx.stroke();

      // Track tick markers (-50m, 0m, 50m)
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '9px var(--font-sans)';
      ctx.textAlign = 'center';
      
      const ticks = [-50, -25, 0, 25, 50];
      ticks.forEach(tick => {
        const tx = trackCenter + tick * scale;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, trackY);
        ctx.lineTo(tx, trackY + 8);
        ctx.stroke();
        
        ctx.fillText(`${tick}m`, tx, trackY + 18);
      });

      // 4. Draw Car (Centered on posX)
      const carX = trackCenter + s.posX * scale;
      const carY = trackY - 14;

      ctx.save();
      ctx.fillStyle = '#ef4444'; // Red car
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(carX - 18, carY - 10, 36, 16, 3);
      ctx.fill();
      ctx.stroke();

      // Cabin roof
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.roundRect(carX - 8, carY - 18, 18, 9, 2);
      ctx.fill();
      ctx.stroke();

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(carX - 10, carY + 8, 5, 0, Math.PI * 2);
      ctx.arc(carX + 10, carY + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. Draw Motion Vectors on top of the car
      if (isVectorVisible && !s.isStopped) {
        // Velocity vector (green, direction matches sign)
        if (Math.abs(s.velV) > 0.1) {
          const velArrowX = carX + s.velV * 1.5;
          drawArrow(ctx, carX, carY - 25, velArrowX, carY - 25, '#34d399', 2, 6);
          ctx.fillStyle = '#34d399';
          ctx.font = '9px var(--font-sans)';
          ctx.fillText(`v = ${s.velV.toFixed(1)}m/s`, carX, carY - 36);
        }

        // Acceleration vector (red, constant size, points left/right depending on sign)
        if (Math.abs(accel) > 0.05) {
          const accArrowX = carX + Math.sign(accel) * 25;
          drawArrow(ctx, carX, carY + 16, accArrowX, carY + 16, '#fb923c', 1.8, 5);
          ctx.fillStyle = '#fb923c';
          ctx.font = '9px var(--font-sans)';
          ctx.fillText(`a = ${accel.toFixed(1)}m/s²`, carX, carY + 28);
        }
      }

      // 6. Draw 3 Split Graphs (Right Side)
      // Height slices: x-t at top, v-t in middle, a-t at bottom
      const graphX = dividerX + 45;
      const graphW = w - graphX - 20;
      
      const maxTime = Math.max(8, s.time);

      const drawSubGraph = (
        subY: number,
        subH: number,
        label: string,
        valKey: 'x' | 'v' | 'a',
        minVal: number,
        maxVal: number,
        color: string
      ) => {
        // Draw sub axis
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // vertical
        ctx.moveTo(graphX, subY - subH);
        ctx.lineTo(graphX, subY);
        // horizontal (zero axis line)
        const zeroY = subY - ((0 - minVal) / (maxVal - minVal)) * subH;
        ctx.moveTo(graphX, zeroY);
        ctx.lineTo(graphX + graphW, zeroY);
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 9px var(--font-sans)';
        ctx.textAlign = 'left';
        ctx.fillText(label, graphX + 5, subY - subH + 10);

        // Draw data curve
        if (s.history.length > 0) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          
          s.history.forEach((pt, idx) => {
            const gx = graphX + (pt.t / maxTime) * graphW;
            const val = pt[valKey];
            const clamped = Math.max(minVal, Math.min(val, maxVal));
            const gy = subY - ((clamped - minVal) / (maxVal - minVal)) * subH;

            if (idx === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
          });
          ctx.stroke();
        }
      };

      // Stacked graphs
      drawSubGraph(100, 75, '位移 x-t (m)', 'x', -55, 55, '#38bdf8');
      drawSubGraph(210, 75, '速度 v-t (m/s)', 'v', -30, 30, '#34d399');
      drawSubGraph(320, 75, '加速度 a-t (m/s²)', 'a', -12, 12, '#fb923c');

      // 7. Readings
      drawLabel(ctx, `时间 t: ${s.time.toFixed(2)} s`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `位移 x: ${s.posX.toFixed(1)} m`, 110, 20, '12px var(--font-sans)', '#38bdf8');
      drawLabel(ctx, `速度 v: ${s.velV.toFixed(1)} m/s`, 200, 20, '12px var(--font-sans)', '#34d399');

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, v0, accel]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
