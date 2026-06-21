"use client";
import React, { useEffect, useRef, useState } from 'react';
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

export const ProjectileMotion: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const initH = parameters.height ?? 50;  // Initial height (10 to 100 meters)
  const v0 = parameters.v0 ?? 20;         // Launch speed (5 to 50 m/s)
  const g = parameters.g ?? 9.8;          // Gravity (5 to 20 m/s^2)

  // Target ring position on the ground (dragable)
  const [targetX, setTargetX] = useState<number>(180);
  const isDraggingTargetRef = useRef<boolean>(false);

  // Trajectory physical states
  const stateRef = useRef({
    time: 0,
    ballX: 0,
    ballY: 0,
    isFinished: false,
    trail: [] as { x: number; y: number }[],
    isHit: false,
    initialized: false
  });

  const resetSimulation = () => {
    const s = stateRef.current;
    s.time = 0;
    s.ballX = 0;
    s.ballY = initH;
    s.isFinished = false;
    s.trail = [];
    s.isHit = false;
    s.initialized = true;
  };

  // Reset when launch configuration changes
  useEffect(() => {
    resetSimulation();
  }, [initH, v0, g]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Scale mapping: 1m = 3 pixels.
    // Origin at bottom-left: Ground is Y = 310. Launcher starts at X = 80, Y = 310 - H*3
    const scale = 2.4;
    const startX = 80;
    const groundY = 310;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Ground line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, groundY);
      ctx.lineTo(w - 10, groundY);
      ctx.stroke();

      // Grass filler
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(10, groundY + 1.5, w - 20, h - groundY - 5);

      const s = stateRef.current;
      if (!s.initialized) return;

      // 2. Physics Update
      if (isPlaying && !s.isFinished) {
        const dt = 0.02 * simSpeed;
        s.time += dt;

        // Kinematics formulas
        s.ballX = v0 * s.time;
        s.ballY = initH - 0.5 * g * s.time * s.time;

        // Record trail coordinates (screen pixels)
        const screenX = startX + s.ballX * scale;
        const screenY = groundY - s.ballY * scale;

        s.trail.push({ x: screenX, y: screenY });

        // Hit ground check
        if (s.ballY <= 0) {
          s.ballY = 0;
          s.ballX = v0 * Math.sqrt((2 * initH) / g); // theoretical landing X
          s.isFinished = true;
          
          // Check if landed in target ring
          const landXScreen = startX + s.ballX * scale;
          const distToTarget = Math.abs(landXScreen - targetX);
          if (distToTarget < 25) {
            s.isHit = true;
          }
        }
      }

      // Screen ball position
      const bx = startX + s.ballX * scale;
      const by = groundY - s.ballY * scale;

      // 3. Draw Trajectory Trail
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      s.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // 4. Draw Cannon / Launcher tower
      ctx.fillStyle = '#334155';
      const towerHPx = initH * scale;
      ctx.fillRect(startX - 15, groundY - towerHPx, 25, towerHPx);
      
      // Cannon muzzle
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(startX - 10, groundY - towerHPx - 8, 25, 12, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 5. Draw Target Ring (Dragable)
      ctx.strokeStyle = s.isHit ? '#10b981' : '#f43f5e'; // Green if hit, red if not
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(targetX, groundY, 20, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw a small flag pole on target
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(targetX + 15, groundY);
      ctx.lineTo(targetX + 15, groundY - 25);
      ctx.stroke();
      
      // Flag triangle
      ctx.fillStyle = s.isHit ? '#10b981' : '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(targetX + 15, groundY - 25);
      ctx.lineTo(targetX - 2, groundY - 18);
      ctx.lineTo(targetX + 15, groundY - 12);
      ctx.closePath();
      ctx.fill();

      // Drag overlay circle on target
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(targetX, groundY, 15, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Draw Projectile Ball
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();

      // 7. Draw Velocity Vectors
      if (isVectorVisible && !s.isFinished) {
        // Horizontal component v_x (constant)
        const vxArrowLen = v0 * 1.5;
        drawArrow(ctx, bx, by, bx + vxArrowLen, by, '#34d399', 1.8, 6);
        ctx.fillStyle = '#34d399';
        ctx.font = '9px var(--font-sans)';
        ctx.fillText(`vₓ = ${v0.toFixed(0)}m/s`, bx + 10, by - 12);

        // Vertical component v_y = gt (downward)
        const vyVal = g * s.time;
        if (vyVal > 0.5) {
          const vyArrowLen = vyVal * 1.5;
          drawArrow(ctx, bx, by, bx, by + vyArrowLen, '#ef4444', 1.8, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillText(`v_y = -${vyVal.toFixed(1)}m/s`, bx + 10, by + vyArrowLen + 2);
        }

        // Resultant vector v
        const resV = Math.sqrt(v0*v0 + vyVal*vyVal);
        const angle = Math.atan2(vyVal, v0);
        drawArrow(
          ctx, bx, by, 
          bx + Math.cos(angle) * (resV * 1.5), 
          by + Math.sin(angle) * (resV * 1.5), 
          '#fbbf24', 2.2, 8
        );
      }

      // Hit sparks / text banner
      if (s.isFinished) {
        if (s.isHit) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 20px var(--font-sans)';
          ctx.textAlign = 'center';
          ctx.fillText('命中靶心！(HIT)', cx, 100);
          
          // Confetti sparks
          ctx.fillStyle = '#fbbf24';
          for (let i = 0; i < 12; i++) {
            const rx = bx + (Math.random() - 0.5) * 40;
            const ry = by - Math.random() * 30;
            ctx.fillRect(rx, ry, 3, 3);
          }
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 15px var(--font-sans)';
          ctx.textAlign = 'center';
          ctx.fillText('未命中，请拖动靶圈调整位置', cx, 100);
        }
      }

      // 8. Text readouts
      const curX = s.ballX;
      const curY = s.ballY;
      const currentVy = g * s.time;
      const resSpeed = Math.sqrt(v0 * v0 + currentVy * currentVy);
      
      drawLabel(ctx, `时间 t = ${s.time.toFixed(2)} s`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `水平射程 x = ${curX.toFixed(1)} m`, 20, 48, '12px var(--font-sans)', '#34d399');
      drawLabel(ctx, `实时高度 y = ${curY.toFixed(1)} m`, 20, 76, '12px var(--font-sans)', '#ef4444');
      drawLabel(ctx, `合速度 v = ${resSpeed.toFixed(1)} m/s`, w - 150, 20, '12px var(--font-sans)', '#fbbf24');

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Unified handlers to support dragging the target ring left/right
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Target ring is near groundY (310), check bounds
      if (Math.abs(my - groundY) < 30 && Math.abs(mx - targetX) < 40) {
        isDraggingTargetRef.current = true;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingTargetRef.current) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;

      // Clamp targetX inside canvas widths
      let tx = mx;
      if (tx < startX + 20) tx = startX + 20;
      if (tx > canvas.width - 40) tx = canvas.width - 40;
      
      setTargetX(tx);
    };

    const handleEnd = () => {
      isDraggingTargetRef.current = false;
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
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, initH, v0, g, targetX]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
