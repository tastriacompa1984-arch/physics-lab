"use client";
import React, { useEffect, useRef } from 'react';
import { drawGrid, drawLabel } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

export const DoubleSlitInterference: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  simSpeed,
  parameters
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const lambda_nm = parameters.wavelength ?? 632; // Light wavelength in nm (380 to 780, e.g. He-Ne laser is 632.8)
  const d_mm = parameters.d ?? 0.25;             // Slit spacing in mm (0.1 to 0.5)
  const L_m = parameters.L ?? 2.0;               // Slit-to-screen distance in m (1.0 to 3.0)

  // Wave phase time
  const timeRef = useRef<number>(0);

  // Helper: Convert wavelength to RGB colors for lasers
  const wavelengthToRGB = (wl: number) => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) {
      r = -(wl - 440) / (440 - 380);
      b = 1.0;
    } else if (wl >= 440 && wl < 490) {
      g = (wl - 440) / (490 - 440);
      b = 1.0;
    } else if (wl >= 490 && wl < 510) {
      g = 1.0;
      b = -(wl - 510) / (510 - 490);
    } else if (wl >= 510 && wl < 580) {
      r = (wl - 510) / (580 - 510);
      g = 1.0;
    } else if (wl >= 580 && wl < 645) {
      r = 1.0;
      g = -(wl - 645) / (645 - 580);
    } else if (wl >= 645 && wl <= 780) {
      r = 1.0;
    }
    // Intensity factor for eye sensitivity limits at edges of spectrum
    let factor = 1.0;
    if (wl >= 380 && wl < 420) factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
    else if (wl >= 700 && wl <= 780) factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);

    return {
      r: Math.round(r * factor * 255),
      g: Math.round(g * factor * 255),
      b: Math.round(b * factor * 255),
      hex: `rgb(${Math.round(r * factor * 255)}, ${Math.round(g * factor * 255)}, ${Math.round(b * factor * 255)})`
    };
  };

  const laserColor = wavelengthToRGB(lambda_nm);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Boundary positions
    const laserX = 40;
    const barrierX = 140;
    const screenX = 280;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Update phase/time if playing
      if (isPlaying) {
        timeRef.current += 0.2 * simSpeed;
      }

      const phase = timeRef.current;

      // 2. Draw Emitter (Laser gun on the left)
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(10, cy - 25, 40, 50, 4);
      ctx.fill();
      ctx.stroke();

      // Laser nozzle
      ctx.fillStyle = laserColor.hex;
      ctx.fillRect(50, cy - 8, 8, 16);

      // Draw incoming parallel laser wavefronts
      ctx.strokeStyle = `${laserColor.hex}55`; // semi transparent laser color
      ctx.lineWidth = 2;
      const waveSpacing = 16;
      for (let x = 58; x < barrierX; x += waveSpacing) {
        const xOffset = (x + phase) % (barrierX - 58);
        const curX = 58 + xOffset;
        ctx.beginPath();
        ctx.moveTo(curX, cy - 50);
        ctx.lineTo(curX, cy + 50);
        ctx.stroke();
      }

      // 3. Draw Double Slit Barrier
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      
      const slitGapPx = d_mm * 60; // scale gap based on d_mm parameter (e.g. 0.25 * 60 = 15px)
      const slit1Y = cy - slitGapPx / 2;
      const slit2Y = cy + slitGapPx / 2;

      ctx.beginPath();
      // top part of barrier
      ctx.moveTo(barrierX, 10);
      ctx.lineTo(barrierX, slit1Y - 4);
      // middle part between slits
      ctx.moveTo(barrierX, slit1Y + 4);
      ctx.lineTo(barrierX, slit2Y - 4);
      // bottom part of barrier
      ctx.moveTo(barrierX, slit2Y + 4);
      ctx.lineTo(barrierX, h - 10);
      ctx.stroke();

      // Labels for slits
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '9px var(--font-sans)';
      ctx.fillText('S₁', barrierX - 18, slit1Y + 3);
      ctx.fillText('S₂', barrierX - 18, slit2Y + 3);

      // 4. Draw interference wave arcs (diffraction from S1 and S2)
      // Concentric circles center at S1 and S2
      ctx.save();
      const numArcs = 8;
      const arcDist = 18; // spacing between arcs

      for (let i = 0; i < numArcs; i++) {
        const radOffset = (i * arcDist + phase) % (screenX - barrierX);
        const radius = radOffset;

        ctx.strokeStyle = `${laserColor.hex}33`; // soft waves
        ctx.lineWidth = 1.5;

        // Wave from Slit 1
        ctx.beginPath();
        ctx.arc(barrierX, slit1Y, radius, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();

        // Wave from Slit 2
        ctx.beginPath();
        ctx.arc(barrierX, slit2Y, radius, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Draw Screen (Vertical board at X = 280)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(screenX, 20);
      ctx.lineTo(screenX, h - 20);
      ctx.stroke();

      // 6. Draw Interference Fringes on the right side screen area (X = 330 to 620)
      const fringeX = 340;
      const fringeW = 55;
      const fringeH = h - 60;
      const fringeY = 30;

      // Draw fringe viewport black backing
      ctx.fillStyle = '#000000';
      ctx.fillRect(fringeX, fringeY, fringeW, fringeH);

      // Intensity curve area: X = 430 to 600
      const curveX = 420;
      const curveW = w - curveX - 20;

      // Draw curve baseline grid
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(curveX, fringeY);
      ctx.lineTo(curveX, fringeY + fringeH);
      ctx.stroke();

      // Physics logic for fringes:
      // Fringe distance on screen: delta_y = L * lambda / d
      // Wavelength is in nm (e.g. 600 * 10^-9 m). d is in mm (e.g. 0.25 * 10^-3 m). L is in m (e.g. 2.0 m).
      // Let's compute a scale factor to make the bands visually responsive!
      // Fringe pitch in screen pixels:
      const lambda_m = lambda_nm * 1e-9;
      const d_m = d_mm * 1e-3;
      const deltaY_px = (L_m * lambda_m / d_m) * 6e5; // visually scaled factor (gives ~20-50px)

      // Draw fringes and intensity curve slice by slice vertically
      ctx.save();
      
      // We will trace vertically from Y = fringeY to Y = fringeY + fringeH
      const resolution = 2; // pixel step
      ctx.beginPath();

      const centerY = fringeY + fringeH / 2;

      for (let y = fringeY; y <= fringeY + fringeH; y += resolution) {
        const dy = y - centerY; // vertical offset from center fringe (m=0)
        
        // Double-slit interference equation: I = I0 * cos^2(pi * d * dy / (L * lambda))
        // Phase angle = Math.PI * dy / deltaY_px
        const phaseVal = Math.PI * dy / deltaY_px;
        const intensity = Math.cos(phaseVal) * Math.cos(phaseVal); // 0 to 1

        // Render color band in fringe box
        // Blend laser color with black background based on intensity
        const rVal = Math.round(laserColor.r * intensity);
        const gVal = Math.round(laserColor.g * intensity);
        const bVal = Math.round(laserColor.b * intensity);
        ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
        ctx.fillRect(fringeX, y, fringeW, resolution);

        // Map intensity to curve X coordinate
        const cxVal = curveX + intensity * curveW;
        if (y === fringeY) {
          ctx.moveTo(cxVal, y);
        } else {
          ctx.lineTo(cxVal, y);
        }
      }

      // Draw intensity curve profile (colored fill)
      ctx.strokeStyle = laserColor.hex;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill area under curve
      ctx.lineTo(curveX, fringeY + fringeH);
      ctx.lineTo(curveX, fringeY);
      ctx.fillStyle = `${laserColor.hex}22`; // soft filled area
      ctx.fill();
      ctx.restore();

      // Fringe box outline
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(fringeX, fringeY, fringeW, fringeH);

      // Label lines for components
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('光强分布 I(y)', curveX + 10, fringeY + 12);
      ctx.fillText('干涉条纹 (Screen)', fringeX - 35, h - 15);

      // 7. Write data values
      const deltaY_mm = (L_m * (lambda_nm * 1e-9) / (d_mm * 1e-3)) * 1000; // in mm

      drawLabel(ctx, `激光波长 λ = ${lambda_nm} nm`, 20, 20, '12px var(--font-sans)', laserColor.hex);
      drawLabel(ctx, `双缝间距 d = ${d_mm.toFixed(2)} mm`, 150, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `缝屏距离 L = ${L_m.toFixed(1)} m`, 270, 20, '12px var(--font-sans)', 'var(--text-primary)');

      drawLabel(ctx, `条纹间距 Δx = Lλ/d = ${deltaY_mm.toFixed(2)} mm`, 20, 50, '12px var(--font-sans)', '#fbbf24');

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, simSpeed, lambda_nm, d_mm, L_m, laserColor]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
