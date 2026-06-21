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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  state: 'solid' | 'liquid' | 'gas';
}

export const MeltingCurve: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  simSpeed,
  parameters
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Physical states
  const stateRef = useRef({
    temperature: -20.0, // °C
    heatAdded: 0,
    time: 0,
    meltedProgress: 0,  // 0 to 1 (solid to liquid)
    vaporProgress: 0,   // 0 to 1 (liquid to gas)
    history: [] as { t: number; temp: number }[],
    particles: [] as Particle[],
    initialized: false
  });

  const power = parameters.power ?? 400; // Heating power (100 - 1000 W)
  const mass = parameters.mass ?? 100;   // Ice mass (50 - 200 g)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Helper: Initialize particles in a solid crystal lattice
    const initParticles = () => {
      const parts: Particle[] = [];
      const cols = 8;
      const rows = 6;
      const spacing = 14;
      const startX = 100;
      const startY = 160;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Add minor offset for hexagonal alignment
          const offset = r % 2 === 0 ? 0 : spacing / 2;
          const x = startX + c * spacing + offset;
          const y = startY + r * spacing;

          parts.push({
            x,
            y,
            vx: 0,
            vy: 0,
            baseX: x,
            baseY: y,
            state: 'solid'
          });
        }
      }
      stateRef.current.particles = parts;
      stateRef.current.initialized = true;
    };

    if (!stateRef.current.initialized) {
      initParticles();
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Split layout: Left is Beaker animation, Right is Graph
      const dividerX = 280;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      const s = stateRef.current;

      // 2. Physics calculations (Euler updates)
      if (isPlaying) {
        // Scale delta time based on simSpeed
        const dt = 0.05 * simSpeed;
        s.time += dt;

        // Q = P * dt (Heat energy in Joules)
        const dQ = power * dt * 2.5; // Scaled for speed
        s.heatAdded += dQ;

        // Specific heat capacities and Latent Heats (approximate values for simulation speed)
        const c_ice = 2.1; // J/(g * °C)
        const c_water = 4.2; // J/(g * °C)
        const L_fusion = 334; // Latent Heat of Fusion J/g
        const L_vapor = 2260; // Latent Heat of Vaporization J/g

        if (s.temperature < 0) {
          // 1. Solid heating
          const dT = dQ / (c_ice * mass);
          s.temperature += dT;
          if (s.temperature > 0) s.temperature = 0;
        } else if (s.temperature === 0 && s.meltedProgress < 1.0) {
          // 2. Solid to Liquid Melting (latente heat)
          const dMelt = dQ / (L_fusion * mass);
          s.meltedProgress += dMelt;
          if (s.meltedProgress >= 1.0) {
            s.meltedProgress = 1.0;
            // Particles state convert
            s.particles.forEach(p => p.state = 'liquid');
          }
        } else if (s.temperature >= 0 && s.temperature < 100) {
          // 3. Liquid heating
          const dT = dQ / (c_water * mass);
          s.temperature += dT;
          if (s.temperature > 100) s.temperature = 100;
        } else if (s.temperature === 100 && s.vaporProgress < 1.0) {
          // 4. Liquid to Gas Boiling (latent heat)
          const dVap = dQ / (L_vapor * mass);
          s.vaporProgress += dVap;
          // Set random particles to gas state and float them away
          const countToGas = Math.floor(s.particles.length * s.vaporProgress);
          s.particles.forEach((p, idx) => {
            if (idx < countToGas) p.state = 'gas';
          });
        }

        // Record history for graph plot
        // Store point every 0.5 sec roughly
        if (s.history.length === 0 || s.time - s.history[s.history.length - 1].t > 0.3) {
          s.history.push({ t: s.time, temp: s.temperature });
        }
      }

      // 3. Draw Beaker, Liquid, Heater
      // Beaker dimensions
      const beakerX = 70;
      const beakerY = 120;
      const beakerW = 140;
      const beakerH = 120;

      // Draw heater stand & fire
      ctx.fillStyle = '#334155';
      ctx.fillRect(beakerX - 10, beakerY + beakerH + 15, beakerW + 20, 8);
      
      // Fire flame under beaker
      if (isPlaying) {
        ctx.fillStyle = '#f97316';
        for (let i = 0; i < 5; i++) {
          const fx = beakerX + 15 + i * 25 + Math.random() * 6;
          const fy = beakerY + beakerH + 15;
          const fh = 15 + Math.random() * 10 * (power / 500); // taller flames at high power
          ctx.beginPath();
          ctx.moveTo(fx - 10, fy);
          ctx.quadraticCurveTo(fx, fy - fh, fx + 10, fy);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw Beaker
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerY);
      ctx.lineTo(beakerX, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY);
      ctx.stroke();

      // Water level (liquids)
      if (s.meltedProgress > 0) {
        // Rising blue liquid inside beaker
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        const fillHeight = beakerH * 0.5 * s.meltedProgress;
        ctx.fillRect(beakerX + 2, beakerY + beakerH - fillHeight, beakerW - 4, fillHeight);
      }

      // 4. Update and Draw Particles
      // Thermal vibration amplitude increases with temperature
      const tempK = s.temperature + 20; // 0 to 120 scale
      const vibAmp = Math.max(1, (tempK / 120) * 8);

      s.particles.forEach((p, idx) => {
        if (p.state === 'solid') {
          // Vibrates around baseX, baseY
          p.x = p.baseX + (Math.random() - 0.5) * vibAmp * 0.5;
          p.y = p.baseY + (Math.random() - 0.5) * vibAmp * 0.5;
          
          // Draw solid ice cubes (light cyan-blue)
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(p.x - 5, p.y - 5, 10, 10, 2);
          ctx.fill();
          ctx.stroke();

        } else if (p.state === 'liquid') {
          // Move randomly within beaker bounds (liquid state)
          // Add velocity jitter
          p.vx += (Math.random() - 0.5) * vibAmp * 0.15;
          p.vy += (Math.random() - 0.5) * vibAmp * 0.15;

          // Damp velocity
          p.vx *= 0.8;
          p.vy *= 0.8;

          p.x += p.vx;
          p.y += p.vy;

          // Boundary checks for beaker
          const minX = beakerX + 10;
          const maxX = beakerX + beakerW - 10;
          const minY = beakerY + beakerH - (beakerH * 0.45);
          const maxY = beakerY + beakerH - 8;

          if (p.x < minX) { p.x = minX; p.vx *= -1; }
          if (p.x > maxX) { p.x = maxX; p.vx *= -1; }
          if (p.y < minY) { p.y = minY; p.vy *= -1; }
          if (p.y > maxY) { p.y = maxY; p.vy *= -1; }

          // Draw liquid particles (blue spheres)
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.state === 'gas') {
          // Escaping gas molecules float UP out of the beaker
          if (p.vy === 0) {
            p.vx = (Math.random() - 0.5) * 1.5;
            p.vy = -1.2 - Math.random() * 1.0;
          }
          p.x += p.vx;
          p.y += p.vy;

          // Draw steam/vapor particle (fading white circle)
          const opacity = Math.max(0, 1 - (beakerY - p.y) / 80);
          ctx.fillStyle = `rgba(241, 245, 249, ${opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Draw Thermometer inside beaker
      const thermX = beakerX + beakerW - 25;
      const thermY = beakerY - 30;
      const thermH = beakerH + 20;
      
      // Tube
      ctx.fillStyle = '#334155';
      ctx.fillRect(thermX - 4, thermY, 8, thermH);
      
      // Bulb at bottom
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(thermX, thermY + thermH, 10, 0, Math.PI * 2);
      ctx.fill();

      // Red mercury column rises with temperature (-20°C to 100°C)
      const pct = (s.temperature + 20) / 120; // 0 to 1
      const columnH = (thermH - 20) * pct;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(thermX - 2.5, thermY + thermH - columnH, 5, columnH);

      // 6. Draw Temperature-Time Graph (Right Column)
      const graphX = dividerX + 50;
      const graphY = h - 60;
      const graphW = w - graphX - 30;
      const graphH = h - 110;

      // Draw graph borders
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(graphX, graphY - graphH - 10);
      ctx.lineTo(graphX, graphY);
      ctx.lineTo(graphX + graphW + 10, graphY);
      ctx.stroke();

      // Draw labels & ticks
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px var(--font-sans)';
      ctx.textAlign = 'right';
      
      // Y-axis ticks (-20, 0, 50, 100)
      const temps = [-20, 0, 50, 100];
      temps.forEach(temp => {
        const yPct = (temp + 20) / 120;
        const gy = graphY - graphH * yPct;
        
        ctx.beginPath();
        ctx.moveTo(graphX - 4, gy);
        ctx.lineTo(graphX, gy);
        ctx.stroke();
        
        ctx.fillText(`${temp}℃`, graphX - 8, gy + 3);

        // Dashed guide lines for 0 and 100 (phase change lines)
        if (temp === 0 || temp === 100) {
          ctx.save();
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(graphX, gy);
          ctx.lineTo(graphX + graphW, gy);
          ctx.stroke();
          ctx.restore();
        }
      });

      // Axis names
      ctx.textAlign = 'left';
      ctx.fillText('时间 t', graphX + graphW - 10, graphY + 15);
      
      ctx.save();
      ctx.translate(graphX - 35, graphY - graphH + 20);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('温度 T (℃)', 0, 0);
      ctx.restore();

      // Draw history curve line
      if (s.history.length > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        // Calculate time scale: max time in history or 30s
        const maxTime = Math.max(30, s.time);
        
        s.history.forEach((pt, idx) => {
          const gx = graphX + (pt.t / maxTime) * graphW;
          const gy = graphY - ((pt.temp + 20) / 120) * graphH;
          
          if (idx === 0) {
            ctx.moveTo(gx, gy);
          } else {
            ctx.lineTo(gx, gy);
          }
        });
        ctx.stroke();
      }

      // 7. Write status overlay
      let stateName = '固态 (冰)';
      if (s.temperature === 0 && s.meltedProgress < 1) {
        stateName = `冰水共存 (熔化中: ${(s.meltedProgress * 100).toFixed(0)}%)`;
      } else if (s.temperature > 0 && s.temperature < 100) {
        stateName = '液态 (水)';
      } else if (s.temperature === 100 && s.vaporProgress < 1) {
        stateName = `水和水蒸气 (沸腾中: ${(s.vaporProgress * 100).toFixed(0)}%)`;
      } else if (s.vaporProgress >= 1) {
        stateName = '气态 (全部汽化)';
      }

      drawLabel(ctx, `当前状态: ${stateName}`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `实时温度: ${s.temperature.toFixed(1)} ℃`, 20, 50, '12px var(--font-sans)', '#ef4444');

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, simSpeed, power, mass]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
