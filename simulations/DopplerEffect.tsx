"use client";
import React, { useEffect, useRef } from 'react';
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

interface WaveFront {
  cx: number;
  cy: number;
  radius: number;
  opacity: number;
}

export const DopplerEffect: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const vsRatio = parameters.sourceSpeed ?? 0.6; // Speed ratio vs/v_sound (0 to 1.5)
  const freqHz = parameters.sourceFreq ?? 200;    // Emitted frequency (100 to 500)

  // Simulation states
  const stateRef = useRef({
    sourceX: 320, // start in middle
    sourceY: 180,
    waves: [] as WaveFront[],
    emitTimer: 0,
    initialized: false
  });

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

    const v_sound = 70; // speed of sound in pixels/sec
    const sourceSpeed = vsRatio * v_sound; // pixels/sec

    // Observers coordinates
    const obsLeftX = 60;
    const obsRightX = 580;
    const obsY = 180;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      const s = stateRef.current;

      // 2. Physics updates
      if (isPlaying) {
        const dt = 0.03 * simSpeed;
        
        // Move source to the right
        s.sourceX += sourceSpeed * dt;
        
        // Wrap around
        if (s.sourceX > w + 100) {
          s.sourceX = -50;
          s.waves = []; // clear old waves to keep it clean
        }

        // Wave propagation
        s.waves.forEach((wv, idx) => {
          wv.radius += v_sound * dt;
          wv.opacity = Math.max(0, 1 - wv.radius / 360);
          if (wv.radius > 360) {
            s.waves.splice(idx, 1);
          }
        });

        // Wave emission rate (period depends on emitted frequency)
        // Emission period T = 1 / frequency (scaled for animation)
        const emitPeriod = 1.8 / (freqHz / 100);
        s.emitTimer += dt;

        if (s.emitTimer >= emitPeriod) {
          s.emitTimer = 0;
          // Emit a new wavefront at the current source location
          s.waves.push({
            cx: s.sourceX,
            cy: s.sourceY,
            radius: 0,
            opacity: 1.0
          });
        }
      }

      // 3. Draw Observers
      // Left listener (red head/ear)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(obsLeftX, obsY, 8, 0, Math.PI * 2);
      ctx.fill();
      // Draw simple shoulders
      ctx.fillRect(obsLeftX - 12, obsY + 8, 24, 10);

      // Right listener (green head/ear)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(obsRightX, obsY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(obsRightX - 12, obsY + 8, 24, 10);

      // 4. Draw Wave Fronts
      s.waves.forEach(wv => {
        ctx.strokeStyle = `rgba(56, 189, 248, ${wv.opacity * 0.75})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wv.cx, wv.cy, wv.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 5. Draw Supersonic Mach Cone envelope if v_s >= v_sound
      if (vsRatio >= 1.0 && s.waves.length > 2) {
        // Mach angle alpha = asin(v_sound / v_s)
        const alpha = Math.asin(1.0 / vsRatio);
        
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2.5;
        
        // Draw Mach cone line top
        ctx.beginPath();
        ctx.moveTo(s.sourceX, s.sourceY);
        const lineLen = 300;
        ctx.lineTo(s.sourceX - lineLen * Math.cos(alpha), s.sourceY - lineLen * Math.sin(alpha));
        // Draw Mach cone line bottom
        ctx.moveTo(s.sourceX, s.sourceY);
        ctx.lineTo(s.sourceX - lineLen * Math.cos(alpha), s.sourceY + lineLen * Math.sin(alpha));
        ctx.stroke();
        
        // Sonic Boom label
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 11px var(--font-sans)';
        ctx.fillText('激波面 (Shock Wave Front)', s.sourceX - 180, s.sourceY - 45);
      }

      // 6. Draw Moving Sound Source
      ctx.fillStyle = '#fbbf24'; // Yellow active source
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s.sourceX, s.sourceY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw vector arrow for source velocity
      if (isVectorVisible && vsRatio > 0.05) {
        const velArrowX = s.sourceX + vsRatio * 40;
        drawArrow(ctx, s.sourceX, s.sourceY, velArrowX, s.sourceY, '#fbbf24', 2.5, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '9px var(--font-sans)';
        ctx.fillText(`v_s = ${vsRatio.toFixed(1)}Ma`, s.sourceX - 15, s.sourceY - 18);
      }

      // 7. Calculate Doppler-shifted frequencies
      // Source moves to the right.
      // Perceived frequency: f' = f_0 * (v_sound / (v_sound -/+ v_s))
      // For left observer (source is moving away): f_left = f_0 * (1 / (1 + vsRatio))
      // For right observer (source is approaching): f_right = f_0 * (1 / (1 - vsRatio))
      
      const f_left = freqHz * (1 / (1 + vsRatio));
      
      let f_right = 0;
      let rightLabel = '';

      if (vsRatio < 1.0) {
        f_right = freqHz * (1 / (1 - vsRatio));
        rightLabel = `${f_right.toFixed(0)} Hz (音调升高)`;
      } else if (vsRatio === 1.0) {
        rightLabel = '∞ Hz (音障/声屏障)';
      } else {
        rightLabel = '声影区 (超音速，音爆后)';
      }

      // Draw frequencies on top of observer heads
      ctx.font = 'bold 10px var(--font-sans)';
      ctx.textAlign = 'center';
      
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('左侧观察者 (远离)', obsLeftX, obsY - 28);
      ctx.fillText(`${f_left.toFixed(0)} Hz (音调降低)`, obsLeftX, obsY - 14);

      ctx.fillStyle = '#10b981';
      ctx.fillText('右侧观察者 (接近)', obsRightX, obsY - 28);
      ctx.fillText(rightLabel, obsRightX, obsY - 14);

      // On screen labels
      drawLabel(ctx, `波源移动速度: ${vsRatio.toFixed(2)} 倍声速 (马赫数)`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `声源基频: ${freqHz} Hz`, 20, 50, '12px var(--font-sans)', 'var(--text-primary)');

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, vsRatio, freqHz]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
