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

export const SpringMassSystem: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const m = parameters.mass ?? 0.8;          // Mass kg (0.1 to 2.0)
  const k = parameters.k ?? 40.0;           // Spring constant N/m (10 to 100)
  const damping = parameters.damping ?? 0.2; // Damping (0 to 2)

  // Simulation physical values
  const stateRef = useRef({
    x: 1.0,  // displacement in meters (stretch is positive, compression negative)
    v: 0.0,  // velocity m/s
    time: 0,
    history: [] as { t: number; x: number }[],
    initialized: false
  });

  const isDraggingBlockRef = useRef<boolean>(false);

  // Scale: 1m = 60 pixels.
  // Equilibrium X is at cx = 170. Wall is at X = 40.
  // Spring length equilibrium is L0 = 130px.
  const scale = 60;
  const wallX = 40;
  const eqX = 180;
  const trackY = 180;

  useEffect(() => {
    if (!stateRef.current.initialized) {
      stateRef.current.initialized = true;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dividerX = 320;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      const s = stateRef.current;

      // 2. Physics integration step (Euler-Cromer)
      if (isPlaying && !isDraggingBlockRef.current) {
        const dt = 0.025 * simSpeed;
        s.time += dt;

        // F = - kx - bv
        const springForce = -k * s.x;
        const dampingForce = -damping * s.v;
        const netForce = springForce + dampingForce;

        const a = netForce / m;
        s.v += a * dt;
        s.x += s.v * dt;

        // Add history point
        if (s.history.length === 0 || s.time - s.history[s.history.length - 1].t > 0.1) {
          s.history.push({ t: s.time, x: s.x });
        }
      }

      // 3. Draw Track Table
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wallX, trackY + 16);
      ctx.lineTo(dividerX - 20, trackY + 16);
      ctx.stroke();

      // Support wall
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(wallX - 15, trackY - 60, 15, 80);

      // 4. Draw spring (coils zig-zag)
      // Block current position
      const blockX = eqX + s.x * scale;
      const blockWidth = 32;

      // Coil counts
      const numCoils = 16;
      const springStartX = wallX;
      const springEndX = blockX - blockWidth / 2;
      const springWidth = springEndX - springStartX;
      
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(springStartX, trackY);
      
      // Draw coiled segments
      for (let i = 0; i <= numCoils; i++) {
        const px = springStartX + (i / numCoils) * springWidth;
        let py = trackY;
        if (i > 0 && i < numCoils) {
          // alternate up and down
          py = trackY + (i % 2 === 0 ? -12 : 12);
        }
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 5. Draw Block
      ctx.save();
      ctx.fillStyle = '#fb923c'; // Orange block
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(blockX - blockWidth / 2, trackY - 16, blockWidth, 32, 4);
      ctx.fill();
      ctx.stroke();

      // Small weight tag
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${(m).toFixed(1)}kg`, blockX, trackY);
      ctx.restore();

      // Draw drag ring if paused
      if (!isPlaying) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(blockX, trackY, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Equilibrium dashed line
      ctx.save();
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(eqX, trackY - 45);
      ctx.lineTo(eqX, trackY + 45);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#64748b';
      ctx.font = '8px var(--font-sans)';
      ctx.fillText('平衡位置 (O)', eqX - 20, trackY - 48);

      // 6. Draw Force Vectors
      if (isVectorVisible && !isDraggingBlockRef.current) {
        // Spring force vector (Hooke force, acts towards equilibrium)
        // F_s = -k * x. Draw green arrow.
        const f_s = -k * s.x;
        if (Math.abs(f_s) > 0.5) {
          const forceArrowLen = f_s * 1.5; // scale factor
          drawArrow(ctx, blockX, trackY - 26, blockX + forceArrowLen, trackY - 26, '#10b981', 2, 6);
          ctx.fillStyle = '#10b981';
          ctx.font = '9px var(--font-sans)';
          ctx.fillText(`F弹 = ${f_s.toFixed(1)}N`, blockX - 20, trackY - 38);
        }

        // Velocity vector (blue arrow)
        if (Math.abs(s.v) > 0.1) {
          const velArrowLen = s.v * 15;
          drawArrow(ctx, blockX, trackY + 26, blockX + velArrowLen, trackY + 26, '#38bdf8', 1.8, 5);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '9px var(--font-sans)';
          ctx.fillText(`v = ${s.v.toFixed(1)}m/s`, blockX - 20, trackY + 38);
        }
      }

      // 7. Graph: Position vs Time (Right Side)
      const graphX = dividerX + 45;
      const graphY = h - 60;
      const graphW = w - graphX - 25;
      const graphH = h - 110;

      // Draw graph borders
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(graphX, graphY - graphH - 10);
      ctx.lineTo(graphX, graphY);
      ctx.lineTo(graphX + graphW + 10, graphY);
      ctx.stroke();

      // Zero axis line in graph
      ctx.save();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1;
      const zeroY = graphY - 0.5 * graphH;
      ctx.beginPath();
      ctx.moveTo(graphX, zeroY);
      ctx.lineTo(graphX + graphW, zeroY);
      ctx.stroke();
      ctx.restore();

      // Ticks & Labels
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px var(--font-sans)';
      ctx.textAlign = 'right';
      ctx.fillText('时间 t', graphX + graphW - 10, graphY + 15);
      
      ctx.save();
      ctx.translate(graphX - 30, graphY - graphH + 35);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('位移 x (m)', 0, 0);
      ctx.restore();

      ctx.fillText('1.5', graphX - 8, graphY - graphH + 5);
      ctx.fillText('0', graphX - 8, zeroY + 3);
      ctx.fillText('-1.5', graphX - 8, graphY - 5);

      // Plot curve
      if (s.history.length > 0) {
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxTime = Math.max(8, s.time);
        s.history.forEach((pt, idx) => {
          const gx = graphX + (pt.t / maxTime) * graphW;
          // map -1.5m to +1.5m to graph boundaries
          const clampedX = Math.max(-1.5, Math.min(pt.x, 1.5));
          const gy = zeroY - (clampedX / 1.5) * (graphH / 2);

          if (idx === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        });
        ctx.stroke();
      }

      // 8. Text readouts
      const potentialEnergy = 0.5 * k * s.x * s.x;
      const kineticEnergy = 0.5 * m * s.v * s.v;
      const totalEnergy = potentialEnergy + kineticEnergy;

      drawLabel(ctx, `时间 t = ${s.time.toFixed(2)} s`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `位移 x = ${s.x.toFixed(2)} m`, 120, 20, '12px var(--font-sans)', '#fb923c');
      drawLabel(ctx, `弹势能 Ep = ${potentialEnergy.toFixed(2)} J`, 20, 48, '11px var(--font-sans)', '#10b981');
      drawLabel(ctx, `动能 Ek = ${kineticEnergy.toFixed(2)} J`, 130, 48, '11px var(--font-sans)', '#38bdf8');

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Unified handlers to support dragging the block
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Check click proximity to block X
      const blockX = eqX + stateRef.current.x * scale;
      if (Math.abs(mx - blockX) < 25 && Math.abs(my - trackY) < 25) {
        isDraggingBlockRef.current = true;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingBlockRef.current) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;

      // Calculate displacement relative to eqX
      const x_px = mx - eqX;
      let x = x_px / scale;

      // Clamp displacement between -1.5m and 1.5m
      if (x < -1.5) x = -1.5;
      if (x > 1.5) x = 1.5;

      stateRef.current.x = x;
      stateRef.current.v = 0; // stop velocity during drag
    };

    const handleEnd = () => {
      isDraggingBlockRef.current = false;
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
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, m, k, damping]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
