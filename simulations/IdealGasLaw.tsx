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

interface GasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const IdealGasLaw: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Read parameters
  const tempK = parameters.temp ?? 300;       // Temperature in Kelvin (100 to 600 K)
  const volRatio = parameters.volume ?? 1.0;   // Volume ratio (0.5 to 1.5)
  const numParticles = parameters.particles ?? 100; // Particle count (50 to 300)

  // Dragging piston wall state
  const isDraggingPistonRef = useRef<boolean>(false);

  // Keep particles array in a ref
  const particlesRef = useRef<GasParticle[]>([]);

  useEffect(() => {
    // Generate initial particles
    const parts: GasParticle[] = [];
    const containerW = 200 * volRatio;
    
    for (let i = 0; i < numParticles; i++) {
      const speed = Math.sqrt(tempK) * 0.15; // Speed proportional to sqrt(T)
      const angle = Math.random() * Math.PI * 2;
      parts.push({
        x: 45 + Math.random() * (containerW - 10),
        y: 65 + Math.random() * 150,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#38bdf8'
      });
    }
    particlesRef.current = parts;
  }, [numParticles]); // regenerate if count changes

  // Update particle speeds when temperature changes
  useEffect(() => {
    particlesRef.current.forEach(p => {
      const angle = Math.atan2(p.vy, p.vx);
      const speed = Math.sqrt(tempK) * 0.15;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    });
  }, [tempK]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Container box coordinates
    const startX = 40;
    const startY = 60;
    const containerH = 160;
    
    // Scale: Volume ratio 1.0 corresponds to 180px width
    const baseW = 160;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dividerX = 290;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // 2. Calculations
      const containerW = baseW * volRatio;
      const volumeVal = volRatio; // arbitrary unit
      // P = N * k * T / V (Arbitrary scale factor so pressure needle sits nicely)
      const k_const = 0.0035;
      const pressure = (numParticles * k_const * tempK) / volumeVal;

      // Update particle positions
      const parts = particlesRef.current;
      
      if (isPlaying && !isDraggingPistonRef.current) {
        const dt = 0.6 * simSpeed;
        
        parts.forEach(p => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Elastic collision checks with container walls
          const minX = startX + 4;
          const maxX = startX + containerW - 4;
          const minY = startY + 4;
          const maxY = startY + containerH - 4;

          if (p.x < minX) { p.x = minX; p.vx *= -1; }
          if (p.x > maxX) { p.x = maxX; p.vx *= -1; }
          if (p.y < minY) { p.y = minY; p.vy *= -1; }
          if (p.y > maxY) { p.y = maxY; p.vy *= -1; }
        });
      }

      // 3. Draw Gas Container Box
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      // Fixed wall borders (Left, Top, Bottom)
      ctx.beginPath();
      ctx.moveTo(startX + containerW, startY);
      ctx.lineTo(startX, startY);
      ctx.lineTo(startX, startY + containerH);
      ctx.lineTo(startX + containerW, startY + containerH);
      ctx.stroke();

      // Draw Piston Wall (Right side)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Piston block
      ctx.roundRect(startX + containerW - 6, startY - 5, 8, containerH + 10, 2);
      ctx.fill();
      ctx.stroke();

      // Piston handle shaft
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(startX + containerW + 2, startY + containerH / 2 - 4, 30, 8);
      // Handle grip
      ctx.fillStyle = '#64748b';
      ctx.fillRect(startX + containerW + 32, startY + containerH / 2 - 15, 6, 30);

      // Drag highlights on handle
      if (isDraggingPistonRef.current) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX + containerW + 30, startY + containerH / 2 - 17, 10, 34);
      }

      // 4. Draw Gas Particles
      // Heat color theme: blue (cold) at 100K to orange/red (hot) at 600K
      const coldColor = { r: 56, g: 189, b: 248 }; // Cyan
      const hotColor = { r: 239, g: 68, b: 68 };   // Red
      
      const colorPct = (tempK - 100) / 500; // 0 to 1
      const pColorR = Math.round(coldColor.r + (hotColor.r - coldColor.r) * colorPct);
      const pColorG = Math.round(coldColor.g + (hotColor.g - coldColor.g) * colorPct);
      const pColorB = Math.round(coldColor.b + (hotColor.b - coldColor.b) * colorPct);
      const particleColorHex = `rgb(${pColorR}, ${pColorG}, ${pColorB})`;

      ctx.fillStyle = particleColorHex;
      
      // Keep only up to N particles in canvas (in case sliders updated)
      parts.slice(0, numParticles).forEach(p => {
        // Clamp particles inside updated container width if compressed
        const maxX = startX + containerW - 6;
        if (p.x > maxX) {
          p.x = startX + 5 + Math.random() * (containerW - 12);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Draw Pressure Gauge Dial (Bottom of container)
      const drawPressureGauge = (gx: number, gy: number, val: number) => {
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(gx, gy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // needle angle: 0 pressure corresponds to -Math.PI * 0.75, max (400) is Math.PI * 0.75
        const maxPres = 400;
        const pct = Math.min(val / maxPres, 1.0);
        const angle = -Math.PI * 0.75 + pct * Math.PI * 1.5;
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(angle) * 23, gy + Math.sin(angle) * 23);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 9px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.fillText('P (压强)', gx, gy + 14);
        ctx.restore();
      };

      drawPressureGauge(startX + containerW / 2, startY + containerH + 34, pressure);

      // 6. Draw P-V Characteristic Curve (Right side)
      // Hyperbolic Isothermal curve: P = constant / V
      const graphX = dividerX + 45;
      const graphY = h - 60;
      const graphW = w - graphX - 25;
      const graphH = h - 110;

      // Draw axis
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(graphX, graphY - graphH - 10);
      ctx.lineTo(graphX, graphY);
      ctx.lineTo(graphX + graphW + 10, graphY);
      ctx.stroke();

      // Axis label names
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px var(--font-sans)';
      ctx.textAlign = 'right';
      ctx.fillText('体积 V', graphX + graphW - 10, graphY + 15);
      
      ctx.save();
      ctx.translate(graphX - 30, graphY - graphH + 35);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('压强 P', 0, 0);
      ctx.restore();

      // Draw theoretical isothermal line P = NkT / V
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const minVol = 0.5;
      const maxVol = 1.5;
      const maxPlotP = 500.0;

      for (let vStep = minVol; vStep <= maxVol; vStep += 0.05) {
        const pStep = (numParticles * k_const * tempK) / vStep;
        const gx = graphX + ((vStep - minVol) / (maxVol - minVol)) * graphW;
        const gy = graphY - (pStep / maxPlotP) * graphH;
        
        if (vStep === minVol) {
          ctx.moveTo(gx, gy);
        } else {
          ctx.lineTo(gx, gy);
        }
      }
      ctx.stroke();

      // Current operating point dot (Yellow)
      const opGx = graphX + ((volRatio - minVol) / (maxVol - minVol)) * graphW;
      const opGy = graphY - (pressure / maxPlotP) * graphH;

      ctx.save();
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(opGx, opGy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 7. Write readouts
      drawLabel(ctx, `温度 T = ${tempK.toFixed(0)} K`, 20, 20, '12px var(--font-sans)', particleColorHex);
      drawLabel(ctx, `粒子数 N = ${numParticles}`, 120, 20, '12px var(--font-sans)', 'var(--text-primary)');
      
      // Core calculations
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.fillText(`计算压强 P = NkT / V = ${pressure.toFixed(1)} kPa`, 20, h - 30);
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '9px var(--font-sans)';
      ctx.fillText('提示: 可向左右拖动容器右侧手柄调整体积', 20, h - 14);

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Unified handlers to support dragging container piston handle
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      const containerW = baseW * volRatio;
      const handleX = startX + containerW + 35;
      const handleY = startY + containerH / 2;

      // Check click proximity to handle
      if (Math.abs(mx - handleX) < 25 && Math.abs(my - handleY) < 30) {
        isDraggingPistonRef.current = true;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingPistonRef.current) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;

      // Calculate new volume ratio based on handle displacement
      const w_px = mx - startX - 35;
      let vr = w_px / baseW;

      // Clamp volume ratio between 0.5 and 1.5
      if (vr < 0.5) vr = 0.5;
      if (vr > 1.5) vr = 1.5;

      // Trigger parameter updates back to react container
      onRecordData({ volume: vr });
    };

    const handleEnd = () => {
      isDraggingPistonRef.current = false;
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
  }, [isPlaying, isGridVisible, simSpeed, tempK, volRatio, numParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
