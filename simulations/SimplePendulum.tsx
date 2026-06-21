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

export const SimplePendulum: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const L = parameters.length ?? 1.5;      // Length of pendulum (0.5 to 3.0 m)
  const mass = parameters.mass ?? 1.0;     // Mass (0.1 to 5.0 kg)
  const g = parameters.gravity ?? 9.8;     // Gravity acceleration (5.0 to 20.0 m/s^2)
  const damping = parameters.damping ?? 0.05; // Air damping (0 to 1)

  // Simulation physical quantities
  const simStateRef = useRef({
    theta: (30 * Math.PI) / 180, // Angle in radians (start at 30 deg)
    omega: 0.0,                  // Angular velocity rad/s
    time: 0,
    initialized: false
  });

  const isDraggingBobRef = useRef<boolean>(false);

  // Reset when L or gravity changes, to clamp bob position or keep it reasonable
  useEffect(() => {
    if (!simStateRef.current.initialized) {
      simStateRef.current.initialized = true;
    }
  }, [L, g]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Anchor pivot coordinates
    const px = 160;
    const py = 50;
    
    // Scale: 1m = 80 pixels
    const scale = 80;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dividerX = 320; // Left visualizer, Right plot

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      const s = simStateRef.current;

      // 2. Physics solver (Runge-Kutta 4th Order)
      const getAlpha = (theta: number, omega: number) => {
        // alpha = - (g / L) * sin(theta) - damping * omega
        return -(g / L) * Math.sin(theta) - damping * omega;
      };

      if (isPlaying && !isDraggingBobRef.current) {
        const dt = 0.02 * simSpeed;
        s.time += dt;

        // RK4 steps
        const k1_theta = s.omega;
        const k1_omega = getAlpha(s.theta, s.omega);

        const k2_theta = s.omega + 0.5 * dt * k1_omega;
        const k2_omega = getAlpha(s.theta + 0.5 * dt * k1_theta, s.omega + 0.5 * dt * k1_omega);

        const k3_theta = s.omega + 0.5 * dt * k2_omega;
        const k3_omega = getAlpha(s.theta + 0.5 * dt * k2_theta, s.omega + 0.5 * dt * k2_omega);

        const k4_theta = s.omega + dt * k3_omega;
        const k4_omega = getAlpha(s.theta + dt * k3_theta, s.omega + dt * k3_omega);

        s.theta += (dt / 6) * (k1_theta + 2 * k2_theta + 2 * k3_theta + k4_theta);
        s.omega += (dt / 6) * (k1_omega + 2 * k2_omega + 2 * k3_omega + k4_omega);
      }

      // Bob coordinates
      const L_px = L * scale;
      const bobX = px + L_px * Math.sin(s.theta);
      const bobY = py + L_px * Math.cos(s.theta);

      // 3. Draw Pendulum
      // Support plate
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 30, py - 6, 60, 6);
      
      // Pivot dot
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // String wire
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob sphere
      // Size depends slightly on mass
      const bobRadius = 8 + Math.sqrt(mass) * 4;
      ctx.fillStyle = '#8b5cf6'; // Violet bob
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Drag overlay circle
      if (!isPlaying) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bobX, bobY, bobRadius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Draw Tangential/Radial Forces (Vectors)
      if (isVectorVisible && !isDraggingBobRef.current) {
        // Tangential velocity v = L * omega
        const tangentialSpeed = L * s.omega;
        const angle = s.theta;
        
        // Direction of velocity is perpendicular to string
        // vx = v * cos(theta), vy = - v * sin(theta)
        const vx = tangentialSpeed * Math.cos(angle);
        const vy = -tangentialSpeed * Math.sin(angle);
        
        // Scale vector for rendering
        const vectorScale = 20;
        drawArrow(ctx, bobX, bobY, bobX + vx * vectorScale, bobY + vy * vectorScale, '#10b981', 2, 6);
        
        // Gravity split forces (Radial vs Tangential)
        // Tension T = m * (g*cos(theta) + L*omega^2)
        const tensionVal = mass * (g * Math.cos(angle) + L * s.omega * s.omega);
        const tx = -tensionVal * Math.sin(angle);
        const ty = -tensionVal * Math.cos(angle);
        
        // Draw Tension force (purple arrow towards pivot)
        drawArrow(ctx, bobX, bobY, bobX + tx * 2.5, bobY + ty * 2.5, '#f43f5e', 1.8, 6);
      }

      // 5. Draw Energy Bar Chart (Right side)
      // E_k = 0.5 * m * (L*omega)^2
      // E_p = m * g * L * (1 - cos(theta))
      const kineticEnergy = 0.5 * mass * (L * s.omega) * (L * s.omega);
      const potentialEnergy = mass * g * L * (1 - Math.cos(s.theta));
      const totalEnergy = kineticEnergy + potentialEnergy;

      // Energy chart layout coordinates
      const chartX = dividerX + 60;
      const chartY = h - 60;
      const chartW = 180;
      const chartH = 150;

      // Draw chart boundingbox
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartX, chartY - chartH, chartW, chartH);

      // Scale energy height: assume max potential energy is initial theta_0 angle without damping (say 45 deg)
      // Max expected energy = mass * g * L * (1 - cos(60deg))
      const maxExpEnergy = mass * g * L * (1 - Math.cos(60 * Math.PI / 180)) + 5.0; // Added safety offset
      const getEnergyHPx = (energyVal: number) => {
        return Math.min(chartH - 10, (energyVal / maxExpEnergy) * (chartH - 20));
      };

      // Draw columns
      // Col 1: Kinetic (Green)
      // Col 2: Potential (Blue)
      // Col 3: Total (Yellow)
      const drawCol = (colIdx: number, val: number, label: string, color: string) => {
        const cx = chartX + 15 + colIdx * 55;
        const colW = 36;
        const colH = getEnergyHPx(val);

        ctx.fillStyle = color;
        ctx.fillRect(cx, chartY - colH, colW, colH);

        // Value text
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '9px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText(`${val.toFixed(1)}J`, cx + colW/2, chartY - colH - 8);

        // Label
        ctx.font = '10px var(--font-sans)';
        ctx.fillText(label, cx + colW/2, chartY + 16);
      };

      drawCol(0, kineticEnergy, '动能 Ek', '#10b981');
      drawCol(1, potentialEnergy, '势能 Ep', '#3b82f6');
      drawCol(2, totalEnergy, '机械能 E', '#fbbf24');

      // 6. Text readouts
      const thetaDeg = (s.theta * 180) / Math.PI;
      const theoreticalPeriod = 2 * Math.PI * Math.sqrt(L / g);

      drawLabel(ctx, `时间 t: ${s.time.toFixed(2)} s`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `偏角 θ: ${thetaDeg.toFixed(1)}°`, 120, 20, '12px var(--font-sans)', '#8b5cf6');
      drawLabel(ctx, `理论周期 T: ${theoreticalPeriod.toFixed(2)} s`, 20, 48, '12px var(--font-sans)', 'var(--text-primary)');

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Unified handlers to support dragging the bob to set launch angle
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Calculate bob position
      const L_px = L * scale;
      const bx = px + L_px * Math.sin(simStateRef.current.theta);
      const by = py + L_px * Math.cos(simStateRef.current.theta);
      
      const bobRadius = 8 + Math.sqrt(mass) * 4;

      // Check click distance
      const dist = Math.sqrt((mx - bx) * (mx - bx) + (my - by) * (my - by));
      if (dist < bobRadius + 15) {
        isDraggingBobRef.current = true;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingBobRef.current) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Calculate angle relative to vertical line downward from pivot (px, py)
      const dx = mx - px;
      const dy = my - py;

      // theta = atan2(dx, dy)
      let theta = Math.atan2(dx, dy);

      // Clamp angle between -90 and 90 degrees
      const maxAngle = (90 * Math.PI) / 180;
      if (theta < -maxAngle) theta = -maxAngle;
      if (theta > maxAngle) theta = maxAngle;

      simStateRef.current.theta = theta;
      simStateRef.current.omega = 0; // stop motion during drag
    };

    const handleEnd = () => {
      isDraggingBobRef.current = false;
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
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, L, mass, g, damping]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
