"use client";
import React, { useEffect, useRef, useState } from 'react';
import { drawGrid, drawLabel, drawArrow } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

interface DropBall {
  y: number;
  v: number;
  a: number;
  mass: number;     // kg
  dragCoeff: number; // k
  color: string;
  name: string;
  isFinished: boolean;
  timeToGround: number;
  history: { t: number; y: number; v: number }[];
}

export const FreeFallComparison: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const height_m = parameters.height ?? 50; // Initial drop height (10 to 100 meters)
  const air_k = parameters.drag ?? 0.2;      // Drag coefficient slider
  const vacuumMode = parameters.vacuum === 1; // 1: vacuum, 0: air

  // Ball presets
  const materialPresets = {
    iron: { name: '铁球', mass: 10.0, drag: 0.04, color: '#f43f5e' },
    wood: { name: '木球', mass: 0.8, drag: 0.05, color: '#38bdf8' },
    feather: { name: '羽毛', mass: 0.01, drag: 0.5, color: '#fbbf24' }
  };

  // Select ball materials from parameters (0: iron, 1: wood, 2: feather)
  const ball1Idx = Math.round(parameters.ball1 ?? 0);
  const ball2Idx = Math.round(parameters.ball2 ?? 2);

  const getPresetByIdx = (idx: number) => {
    const keys = Object.keys(materialPresets) as ('iron' | 'wood' | 'feather')[];
    const key = keys[idx] || 'iron';
    return materialPresets[key];
  };

  const ball1Meta = getPresetByIdx(ball1Idx);
  const ball2Meta = getPresetByIdx(ball2Idx);

  // Ref to hold running simulation states
  const simStateRef = useRef({
    time: 0,
    ball1: null as DropBall | null,
    ball2: null as DropBall | null,
    historyTime: 0,
    initialized: false
  });

  const resetState = () => {
    const s = simStateRef.current;
    s.time = 0;
    s.historyTime = 0;
    
    // Configure drag coefficients. If vacuum mode is ON, drag coefficient is 0.
    const drag1 = vacuumMode ? 0 : ball1Meta.drag * air_k * 4;
    const drag2 = vacuumMode ? 0 : ball2Meta.drag * air_k * 4;

    s.ball1 = {
      y: 0,
      v: 0,
      a: 9.8,
      mass: ball1Meta.mass,
      dragCoeff: drag1,
      color: ball1Meta.color,
      name: ball1Meta.name,
      isFinished: false,
      timeToGround: 0,
      history: []
    };

    s.ball2 = {
      y: 0,
      v: 0,
      a: 9.8,
      mass: ball2Meta.mass,
      dragCoeff: drag2,
      color: ball2Meta.color,
      name: ball2Meta.name,
      isFinished: false,
      timeToGround: 0,
      history: []
    };
    s.initialized = true;
  };

  // Reset when ball types, height, drag coefficient, or vacuum mode change
  useEffect(() => {
    resetState();
  }, [ball1Idx, ball2Idx, height_m, air_k, vacuumMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dividerX = 260; // Left drop visualizer, Right plot

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      const s = simStateRef.current;
      if (!s.initialized || !s.ball1 || !s.ball2) return;

      const g = 9.8; // Gravity m/s^2
      
      // Left Drop visualizer coordinates
      const dropStartY = 60;
      const dropHeightPx = 220; // 100% of height_m corresponds to dropHeightPx

      // Update positions with Euler integration if playing
      if (isPlaying) {
        const dt = 0.02 * simSpeed;
        s.time += dt;

        const updateBall = (b: DropBall) => {
          if (b.isFinished) return;

          // Drag force F_d = - k * v
          const dragForce = b.dragCoeff * b.v;
          // net acceleration a = g - F_d / m
          b.a = g - dragForce / b.mass;
          b.v += b.a * dt;
          b.y += b.v * dt;

          // Record history points
          b.history.push({ t: s.time, y: b.y, v: b.v });

          // Hit ground check
          if (b.y >= height_m) {
            b.y = height_m;
            b.v = 0;
            b.a = 0;
            b.isFinished = true;
            b.timeToGround = s.time;
          }
        };

        updateBall(s.ball1);
        updateBall(s.ball2);
      }

      // 2. Draw Tower and Ground
      ctx.fillStyle = '#1e293b';
      // Ground
      ctx.fillRect(15, dropStartY + dropHeightPx, dividerX - 30, 15);
      // Tower vertical column
      ctx.fillStyle = '#334155';
      ctx.fillRect(30, dropStartY, 20, dropHeightPx);
      
      // Top platform
      ctx.fillRect(15, dropStartY - 8, 80, 8);

      // Lane 1 line (Ball 1 trajectory path)
      const b1x = 110;
      const b2x = 180;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b1x, dropStartY);
      ctx.lineTo(b1x, dropStartY + dropHeightPx);
      ctx.moveTo(b2x, dropStartY);
      ctx.lineTo(b2x, dropStartY + dropHeightPx);
      ctx.stroke();

      // Helper function: Translate physical Y coordinate (meters) to screen Y coordinate (pixels)
      const getScreenY = (physY: number) => {
        return dropStartY + (physY / height_m) * dropHeightPx;
      };

      // 3. Draw Ball 1
      ctx.save();
      const b1Y = getScreenY(s.ball1.y);
      ctx.fillStyle = s.ball1.color;
      ctx.beginPath();
      if (s.ball1.name === '羽毛') {
        // Draw feather leaf shape
        ctx.ellipse(b1x, b1Y, 6, 12, Math.PI / 4, 0, Math.PI * 2);
      } else {
        // Draw normal sphere
        ctx.arc(b1x, b1Y, 8, 0, Math.PI * 2);
      }
      ctx.fill();

      // Velocity vector arrow
      if (isVectorVisible && !s.ball1.isFinished && s.ball1.v > 0.1) {
        const velArrowLen = s.ball1.v * 1.5;
        drawArrow(ctx, b1x, b1Y, b1x, b1Y + velArrowLen, s.ball1.color, 2, 6);
      }
      ctx.restore();

      // 4. Draw Ball 2
      ctx.save();
      const b2Y = getScreenY(s.ball2.y);
      ctx.fillStyle = s.ball2.color;
      ctx.beginPath();
      if (s.ball2.name === '羽毛') {
        // Draw feather leaf shape
        ctx.ellipse(b2x, b2Y, 6, 12, Math.PI / 4, 0, Math.PI * 2);
      } else {
        ctx.arc(b2x, b2Y, 8, 0, Math.PI * 2);
      }
      ctx.fill();

      // Velocity vector arrow
      if (isVectorVisible && !s.ball2.isFinished && s.ball2.v > 0.1) {
        const velArrowLen = s.ball2.v * 1.5;
        drawArrow(ctx, b2x, b2Y, b2x, b2Y + velArrowLen, s.ball2.color, 2, 6);
      }
      ctx.restore();

      // 5. Draw Graphs (Right Side)
      const graphX = dividerX + 45;
      const graphY = h - 50;
      const graphW = w - graphX - 25;
      const graphH = h - 110;

      // Draw graph axis (Y axis is height fallen)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(graphX, graphY - graphH - 10);
      ctx.lineTo(graphX, graphY);
      ctx.lineTo(graphX + graphW + 10, graphY);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('时间 t (s)', graphX + graphW - 20, graphY + 15);
      
      ctx.save();
      ctx.translate(graphX - 30, graphY - graphH + 35);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('下落位移 y (m)', 0, 0);
      ctx.restore();

      // Axis ticks
      ctx.textAlign = 'right';
      const maxTime = Math.max(4, s.time);
      const hMarks = [0, height_m / 2, height_m];
      hMarks.forEach(hm => {
        const gy = graphY - (hm / height_m) * graphH;
        ctx.beginPath();
        ctx.moveTo(graphX - 4, gy);
        ctx.lineTo(graphX, gy);
        ctx.stroke();
        ctx.fillText(`${hm.toFixed(0)}`, graphX - 8, gy + 3);
      });

      // Draw history curves for both balls
      const drawHistoryCurve = (b: DropBall) => {
        if (b.history.length === 0) return;

        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        b.history.forEach((pt, idx) => {
          const gx = graphX + (pt.t / maxTime) * graphW;
          const gy = graphY - (pt.y / height_m) * graphH;
          
          if (idx === 0) {
            ctx.moveTo(gx, gy);
          } else {
            ctx.lineTo(gx, gy);
          }
        });
        ctx.stroke();
      };

      drawHistoryCurve(s.ball1);
      drawHistoryCurve(s.ball2);

      // 6. Text readouts
      drawLabel(ctx, `${s.ball1.name} (左): y = ${s.ball1.y.toFixed(1)}m, v = ${s.ball1.v.toFixed(1)}m/s`, 20, 20, '11px var(--font-sans)', s.ball1.color);
      drawLabel(ctx, `${s.ball2.name} (右): y = ${s.ball2.y.toFixed(1)}m, v = ${s.ball2.v.toFixed(1)}m/s`, 20, 42, '11px var(--font-sans)', s.ball2.color);

      // Display landing times
      if (s.ball1.isFinished) {
        drawLabel(ctx, `${s.ball1.name}落地时间: ${s.ball1.timeToGround.toFixed(2)}s`, b1x - 55, dropStartY + dropHeightPx + 25, '10px var(--font-sans)', s.ball1.color);
      }
      if (s.ball2.isFinished) {
        drawLabel(ctx, `${s.ball2.name}落地时间: ${s.ball2.timeToGround.toFixed(2)}s`, b2x - 55, dropStartY + dropHeightPx + 42, '10px var(--font-sans)', s.ball2.color);
      }

      drawLabel(ctx, `下落总高度: ${height_m} 米`, w - 130, 20, '11px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `环境: ${vacuumMode ? '真空 (Vacuum)' : '空气 (Air)'}`, w - 130, 42, '11px var(--font-sans)', vacuumMode ? 'var(--success)' : 'var(--warning)');

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, ball1Idx, ball2Idx, height_m, air_k, vacuumMode]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
