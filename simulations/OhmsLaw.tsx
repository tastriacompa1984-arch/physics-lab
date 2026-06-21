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

export const OhmsLaw: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  simSpeed,
  parameters
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const voltage = parameters.voltage ?? 6.0;   // V (0 - 15)
  const resistance = parameters.resistance ?? 10.0; // R (1 - 100)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Microscopic electron arrays
    const numMicroElectrons = 35;
    const microElectrons: { x: number; y: number; vx: number; vy: number }[] = [];

    // Distribute electrons inside the zoomed microscopic box (200x90)
    const boxX = 390;
    const boxY = 40;
    const boxW = 210;
    const boxH = 90;

    for (let i = 0; i < numMicroElectrons; i++) {
      microElectrons.push({
        x: boxX + 10 + Math.random() * (boxW - 20),
        y: boxY + 10 + Math.random() * (boxH - 20),
        vx: 1.0 + Math.random() * 2.0,
        vy: (Math.random() - 0.5) * 1.5
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Calculations
      const current = resistance > 0 ? voltage / resistance : 0; // I = V / R (Amps)
      const power = current * voltage; // P = I * V (Watts) (Resistor heating)

      if (isPlaying) {
        // Increment phase for electron movement in wires
        time += current * 4.0 * simSpeed;
      }

      // 2. Draw Circuit Schematic (Coordinates)
      // Left battery: X = 80, Y = 120 -> 240
      // Right resistor: X = 280, Y = 120 -> 240
      // Top wire: Y = 120, Bottom wire: Y = 240
      const circuitX1 = 80;
      const circuitX2 = 280;
      const circuitY1 = 120;
      const circuitY2 = 240;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      
      // Wire paths (connected sections)
      ctx.beginPath();
      // Top wire
      ctx.moveTo(circuitX1, circuitY1);
      ctx.lineTo(circuitX2, circuitY1);
      // Bottom wire
      ctx.moveTo(circuitX1, circuitY2);
      ctx.lineTo(circuitX2, circuitY2);
      // Left vertical wire
      ctx.moveTo(circuitX1, circuitY1);
      ctx.lineTo(circuitX1, circuitY2);
      // Right vertical wire
      ctx.moveTo(circuitX2, circuitY1);
      ctx.lineTo(circuitX2, circuitY2);
      ctx.stroke();

      // A. Draw Battery (left side)
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      // Battery cell plates (alternating long/thin and short/thick)
      const cellY = (circuitY1 + circuitY2) / 2;
      ctx.beginPath();
      // Long line (+)
      ctx.moveTo(circuitX1 - 20, cellY - 15);
      ctx.lineTo(circuitX1 + 20, cellY - 15);
      // Short line (-)
      ctx.moveTo(circuitX1 - 10, cellY - 5);
      ctx.lineTo(circuitX1 + 10, cellY - 5);
      // Second cell (+)
      ctx.moveTo(circuitX1 - 20, cellY + 5);
      ctx.lineTo(circuitX1 + 20, cellY + 5);
      // Second cell (-)
      ctx.moveTo(circuitX1 - 10, cellY + 15);
      ctx.lineTo(circuitX1 + 10, cellY + 15);
      ctx.stroke();
      
      // Battery label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.fillText('+', circuitX1 - 32, cellY - 10);
      ctx.fillText('-', circuitX1 - 32, cellY + 18);
      ctx.restore();

      // B. Draw Resistor (right side)
      // Resistor drawn as a zigzag or rectangular box
      const resY = (circuitY1 + circuitY2) / 2;
      const resW = 20;
      const resH = 50;
      ctx.save();
      // Glow red if heated
      const heatIntensity = Math.min(power / 30, 0.8);
      ctx.fillStyle = heatIntensity > 0.05 ? `rgba(239, 68, 68, ${0.2 + heatIntensity})` : '#334155';
      ctx.strokeStyle = heatIntensity > 0.05 ? '#ef4444' : '#64748b';
      ctx.lineWidth = 2.5;
      
      if (heatIntensity > 0.05) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
      }

      ctx.beginPath();
      ctx.roundRect(circuitX2 - resW / 2, resY - resH / 2, resW, resH, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // C. Draw Ammeter (A) in series (top wire)
      const ammeterX = (circuitX1 + circuitX2) / 2 - 40;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ammeterX, circuitY1, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', ammeterX, circuitY1);

      // D. Draw Voltmeter (V) in parallel (connected around resistor)
      const voltX = circuitX2 + 40;
      // Draw lead wires from resistor terminals to Voltmeter
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(circuitX2, circuitY1 + 10);
      ctx.lineTo(voltX, circuitY1 + 10);
      ctx.lineTo(voltX, resY - 14);
      ctx.moveTo(circuitX2, circuitY2 - 10);
      ctx.lineTo(voltX, circuitY2 - 10);
      ctx.lineTo(voltX, resY + 14);
      ctx.stroke();

      // Voltmeter circle
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(voltX, resY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('V', voltX, resY);

      // 3. Electron flow animation in schematic wires
      // Electrons flow from negative (-) terminal (bottom left) to positive (+) terminal (top left)
      // i.e., Counter-clockwise flow of negative charges (electron current)
      if (current > 0.01) {
        ctx.fillStyle = '#fef08a'; // Glowing yellow electrons
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#facc15';

        // Helper to draw a flowing electron
        const drawWireElectron = (x: number, y: number) => {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        };

        const spacing = 35; // electron spacing
        const totalLoopLength = (circuitX2 - circuitX1) * 2 + (circuitY2 - circuitY1) * 2;
        
        for (let offset = 0; offset < totalLoopLength; offset += spacing) {
          // Add motion time phase
          const pos = (offset + time) % totalLoopLength;
          let ex = 0;
          let ey = 0;

          // Wire routing segment checks
          // Loop starts at bottom left battery negative, goes right, then up, then left, then down.
          const seg1 = circuitX2 - circuitX1; // Bottom wire: left to right
          const seg2 = seg1 + (circuitY2 - circuitY1); // Right wire: bottom to top
          const seg3 = seg2 + (circuitX2 - circuitX1); // Top wire: right to left
          
          if (pos < seg1) {
            // Bottom wire
            ex = circuitX1 + pos;
            ey = circuitY2;
          } else if (pos < seg2) {
            // Right wire (going UP through resistor)
            ex = circuitX2;
            ey = circuitY2 - (pos - seg1);
          } else if (pos < seg3) {
            // Top wire (going LEFT)
            ex = circuitX2 - (pos - seg2);
            ey = circuitY1;
          } else {
            // Left wire (going DOWN through battery)
            ex = circuitX1;
            ey = circuitY1 + (pos - seg3);
          }

          drawWireElectron(ex, ey);
        }
        ctx.restore(); // reset shadow
      }

      // 4. Microscopic View Box (Magnifying glass concept on the right)
      // Renders atoms (obstacles) and electrons colliding.
      ctx.save();
      // Draw box frame
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8'; // Blue magnifying frame
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('电阻微观模型 (Magnified)', boxX + 10, boxY - 8);

      // A. Draw atomic lattice (Copper nuclei)
      // Impurities increase with resistance setting
      const numImpurities = Math.min(10 + Math.floor(resistance * 0.4), 45);
      
      // Draw grid lattice of standard atoms (green)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      const columns = 5;
      const rows = 3;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const ax = boxX + 25 + c * 40;
          const ay = boxY + 20 + r * 25;
          ctx.beginPath();
          ctx.arc(ax, ay, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw red impurity atoms that scatter electrons (randomly placed depending on R)
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 2;
      ctx.shadowColor = '#ef4444';
      
      const seed = Math.round(resistance);
      for (let i = 0; i < numImpurities; i++) {
        // Pseudo-random deterministic placement based on resistance seed
        const pseudoRandX = (Math.sin(i * 123.4 + seed) + 1) / 2;
        const pseudoRandY = (Math.cos(i * 456.7 + seed) + 1) / 2;
        
        const ix = boxX + 15 + pseudoRandX * (boxW - 30);
        const iy = boxY + 15 + pseudoRandY * (boxH - 30);
        
        ctx.beginPath();
        ctx.arc(ix, iy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // B. Update & Draw Microscopic Electrons
      // They accelerate to the left under voltage field: F = qE
      // Collision with atoms resets their velocity
      ctx.fillStyle = '#facc15';
      const electricFieldForce = (voltage / 15.0) * 0.25; // drift speed force

      microElectrons.forEach(me => {
        if (isPlaying) {
          // Accelerate left (electric field pushes electrons from (-) right to (+) left in microscopic section)
          me.vx += electricFieldForce * simSpeed;
          // limit speed
          const maxSpeed = 4.0;
          if (me.vx > maxSpeed) me.vx = maxSpeed;

          me.x += me.vx * simSpeed;
          me.y += me.vy * simSpeed;

          // Wrap around box
          if (me.x > boxX + boxW - 5) {
            me.x = boxX + 5;
            me.y = boxY + 5 + Math.random() * (boxH - 10);
            me.vx = 0.5 + Math.random() * 1.0;
            me.vy = (Math.random() - 0.5) * 1.0;
          }

          // Elastic boundary colliders for top/bottom of micro box
          if (me.y < boxY + 5) { me.y = boxY + 5; me.vy *= -1; }
          if (me.y > boxY + boxH - 5) { me.y = boxY + boxH - 5; me.vy *= -1; }

          // Collision with impurities scattering check
          // If close to a red impurity, scatter velocity
          for (let i = 0; i < numImpurities; i++) {
            const pseudoRandX = (Math.sin(i * 123.4 + seed) + 1) / 2;
            const pseudoRandY = (Math.cos(i * 456.7 + seed) + 1) / 2;
            const ix = boxX + 15 + pseudoRandX * (boxW - 30);
            const iy = boxY + 15 + pseudoRandY * (boxH - 30);
            
            const dx = me.x - ix;
            const dy = me.y - iy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 8) {
              // Collision! Scatter velocity direction (bounces backward or erratically)
              me.vx = -0.5 - Math.random() * 0.5; // recoil back
              me.vy = (Math.random() - 0.5) * 2.0; // scatter vertical
              // move slightly out of collision zone
              me.x += me.vx;
              break;
            }
          }
        }

        // Draw electron
        ctx.beginPath();
        ctx.arc(me.x, me.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Draw Analog仪表 (Dials at the bottom of the canvas)
      // Gauge 1: Voltmeter dial (left side)
      // Gauge 2: Ammeter dial (right side)
      const drawGauge = (gx: number, gy: number, label: string, value: number, maxVal: number, color: string, unit: string) => {
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        
        // Gauge plate
        ctx.beginPath();
        ctx.arc(gx, gy, 35, Math.PI, 0); // half circle
        ctx.lineTo(gx + 35, gy + 15);
        ctx.lineTo(gx - 35, gy + 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tick marks
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
          const tickAngle = Math.PI + (i / 5) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(gx + Math.cos(tickAngle) * 31, gy + Math.sin(tickAngle) * 31);
          ctx.lineTo(gx + Math.cos(tickAngle) * 35, gy + Math.sin(tickAngle) * 35);
          ctx.stroke();
        }

        // Pointer needle
        const needlePct = Math.min(value / maxVal, 1.0);
        const needleAngle = Math.PI + needlePct * Math.PI;
        ctx.strokeStyle = '#ef4444'; // Red pointer needle
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy + 5);
        ctx.lineTo(gx + Math.cos(needleAngle) * 32, gy + Math.sin(needleAngle) * 32);
        ctx.stroke();

        // Pin center cap
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(gx, gy + 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Text value
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 9px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText(`${value.toFixed(2)} ${unit}`, gx, gy + 12);
        ctx.fillStyle = color;
        ctx.font = 'bold 10px var(--font-sans)';
        ctx.fillText(label, gx, gy - 20);
        ctx.restore();
      };

      drawGauge(110, h - 45, '电压表 (V)', voltage, 15.0, '#fbbf24', 'V');
      drawGauge(250, h - 45, '电流表 (A)', current, 1.5, '#34d399', 'A');

      // 6. Draw Text Readouts
      drawLabel(ctx, `电池电压 U = ${voltage.toFixed(1)} V`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `电阻阻值 R = ${resistance.toFixed(0)} Ω`, 160, 20, '12px var(--font-sans)', 'var(--text-primary)');

      // Highlight Ohm's Law summary
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 13px var(--font-sans)';
      ctx.fillText(`通过电阻的电流 I = U / R = ${current.toFixed(3)} A (安培)`, 20, 92);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, simSpeed, voltage, resistance]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
