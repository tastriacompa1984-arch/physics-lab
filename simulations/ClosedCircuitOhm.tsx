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

export const ClosedCircuitOhm: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  simSpeed,
  parameters
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters
  const E = parameters.E ?? 6.0;   // Electromotive force V (1.5 to 12.0)
  const r = parameters.r ?? 1.5;   // Internal resistance Ohm (0.5 to 5.0)
  const R = parameters.R ?? 10.0;  // External resistance Ohm (0 to 50.0)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dividerX = 290;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Calculations
      const current = E / (R + r); // I = E / (R + r)
      const terminalU = E - current * r; // U = E - Ir = I * R
      const internalU = current * r;      // U_r = Ir

      if (isPlaying) {
        time += current * 4.5 * simSpeed;
      }

      // 2. Draw Circuit Schematic (Left side)
      const circuitX1 = 50;
      const circuitX2 = 250;
      const circuitY1 = 110;
      const circuitY2 = 250;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      
      // Wire paths
      ctx.beginPath();
      ctx.moveTo(circuitX1, circuitY1);
      ctx.lineTo(circuitX2, circuitY1);
      ctx.lineTo(circuitX2, circuitY2);
      ctx.lineTo(circuitX1, circuitY2);
      ctx.lineTo(circuitX1, circuitY1);
      ctx.stroke();

      // A. Real Battery with Internal Resistance (dashed box)
      const batCenterY = (circuitY1 + circuitY2) / 2 - 10;
      ctx.save();
      // Dashed envelope showing "Battery Unit"
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.roundRect(circuitX1 - 25, batCenterY - 45, 50, 90, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.fillRect(circuitX1 - 25, batCenterY - 45, 50, 90);

      // Battery label
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('电池组', circuitX1 - 15, batCenterY - 30);

      // Battery Cell Plates (+) (-)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Long (+)
      ctx.moveTo(circuitX1 - 15, batCenterY - 15);
      ctx.lineTo(circuitX1 + 15, batCenterY - 15);
      // Short (-)
      ctx.moveTo(circuitX1 - 8, batCenterY - 7);
      ctx.lineTo(circuitX1 + 8, batCenterY - 7);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px var(--font-sans)';
      ctx.fillText('+', circuitX1 - 22, batCenterY - 12);

      // Internal Resistor symbol (r) drawn inside battery box
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      const resStartY = batCenterY + 5;
      ctx.beginPath();
      ctx.moveTo(circuitX1, resStartY);
      ctx.lineTo(circuitX1 - 8, resStartY + 4);
      ctx.lineTo(circuitX1 + 8, resStartY + 10);
      ctx.lineTo(circuitX1 - 8, resStartY + 16);
      ctx.lineTo(circuitX1, resStartY + 20);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 10px var(--font-sans)';
      ctx.fillText(`r=${r.toFixed(1)}Ω`, circuitX1 - 22, resStartY + 32);
      ctx.restore();

      // B. External Sliding Rheostat (R)
      const extResY = (circuitY1 + circuitY2) / 2 + 10;
      ctx.save();
      ctx.fillStyle = '#3b82f6'; // Blue resistor
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(circuitX2 - 10, extResY - 20, 20, 40, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Diagonal arrow showing variable resistor slider
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      drawArrow(ctx, circuitX2 - 25, extResY + 25, circuitX2 + 15, extResY - 25, '#3b82f6', 1.5, 5);

      // C. Voltmeter (V) measuring 路端电压 U (parallel to battery terminals)
      const voltX = circuitX1 - 42;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(circuitX1, circuitY1 + 10);
      ctx.lineTo(voltX, circuitY1 + 10);
      ctx.lineTo(voltX, batCenterY - 14);
      ctx.moveTo(circuitX1, circuitY2 - 10);
      ctx.lineTo(voltX, circuitY2 - 10);
      ctx.lineTo(voltX, batCenterY + 14);
      ctx.stroke();

      // V circle
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(voltX, batCenterY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V', voltX, batCenterY);

      // D. Ammeter (A) in series (top wire)
      const ammeterX = (circuitX1 + circuitX2) / 2;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ammeterX, circuitY1, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.fillText('A', ammeterX, circuitY1);

      // E. Electron flow in wires (clockwise direction)
      if (current > 0.01) {
        ctx.save();
        ctx.fillStyle = '#fef08a';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#facc15';

        const spacing = 35;
        const totalLoopLength = (circuitX2 - circuitX1) * 2 + (circuitY2 - circuitY1) * 2;
        
        for (let offset = 0; offset < totalLoopLength; offset += spacing) {
          const pos = (offset + time) % totalLoopLength;
          let ex = 0;
          let ey = 0;

          const seg1 = circuitX2 - circuitX1;
          const seg2 = seg1 + (circuitY2 - circuitY1);
          const seg3 = seg2 + (circuitX2 - circuitX1);
          
          if (pos < seg1) {
            // Top wire (going right)
            ex = circuitX1 + pos;
            ey = circuitY1;
          } else if (pos < seg2) {
            // Right wire (going down through R)
            ex = circuitX2;
            ey = circuitY1 + (pos - seg1);
          } else if (pos < seg3) {
            // Bottom wire (going left)
            ex = circuitX2 - (pos - seg2);
            ey = circuitY2;
          } else {
            // Left wire (going up through battery and internal r)
            ex = circuitX1;
            ey = circuitY2 - (pos - seg3);
          }
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Draw U-I Characteristic Curve Graph (Right side)
      // Equation: U = E - I * r
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
      ctx.fillText('电流 I (A)', graphX + graphW - 10, graphY + 15);
      
      ctx.save();
      ctx.translate(graphX - 30, graphY - graphH + 35);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('路端电压 U (V)', 0, 0);
      ctx.restore();

      // Max values for plotting:
      // Max current on X axis: Short circuit current I_short = E/r. We can set X max to 6.0 A.
      // Max voltage on Y axis: E. We can set Y max to 12.0 V.
      const plotMaxI = 6.0;
      const plotMaxU = 12.0;

      // Draw tick marks
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '8px var(--font-mono)';
      ctx.textAlign = 'right';
      // Voltage ticks
      const uMarks = [0, 6, 12];
      uMarks.forEach(um => {
        const gy = graphY - (um / plotMaxU) * graphH;
        ctx.beginPath();
        ctx.moveTo(graphX - 4, gy);
        ctx.lineTo(graphX, gy);
        ctx.stroke();
        ctx.fillText(`${um}`, graphX - 8, gy + 3);
      });

      // Current ticks
      ctx.textAlign = 'center';
      const iMarks = [0, 2, 4, 6];
      iMarks.forEach(im => {
        const gx = graphX + (im / plotMaxI) * graphW;
        ctx.beginPath();
        ctx.moveTo(gx, graphY);
        ctx.lineTo(gx, graphY + 4);
        ctx.stroke();
        ctx.fillText(`${im}`, gx, graphY + 12);
      });

      // Draw theoretical U = E - Ir straight line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)'; // Dashed purple line
      ctx.lineWidth = 1.5;
      
      // Starting point at I=0: U = E
      const startGx = graphX;
      const startGy = graphY - (E / plotMaxU) * graphH;
      // Ending point at U=0: I = E/r (short circuit)
      const shortCircuitI = E / r;
      const endGx = graphX + (shortCircuitI / plotMaxI) * graphW;
      const endGy = graphY;

      ctx.beginPath();
      ctx.moveTo(startGx, startGy);
      ctx.lineTo(endGx, endGy);
      ctx.stroke();

      // Label line
      ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.font = '9px var(--font-sans)';
      ctx.fillText(`U = ${E.toFixed(1)} - ${r.toFixed(1)}·I`, (startGx + endGx) / 2 + 10, (startGy + endGy) / 2 - 10);

      // Draw current operating point (Yellow glowing circle)
      const opGx = graphX + (current / plotMaxI) * graphW;
      const opGy = graphY - (terminalU / plotMaxU) * graphH;

      ctx.save();
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(opGx, opGy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Connect operating point to axis (dashed lines)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      // to X axis
      ctx.moveTo(opGx, opGy);
      ctx.lineTo(opGx, graphY);
      // to Y axis
      ctx.moveTo(opGx, opGy);
      ctx.lineTo(graphX, opGy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Readouts overlay
      drawLabel(ctx, `电动势 E = ${E.toFixed(1)} V`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `外电阻 R = ${R.toFixed(1)} Ω`, 140, 20, '12px var(--font-sans)', '#3b82f6');
      
      // Core outputs
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.fillText(`电流 I = E / (R + r) = ${current.toFixed(2)} A`, 20, 220);
      
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`路端电压 U = E - I·r = ${terminalU.toFixed(2)} V`, 20, 238);

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText(`内阻分压 U_内 = I·r = ${internalU.toFixed(2)} V`, 20, 256);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, simSpeed, E, r, R]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="simulation-canvas"
    />
  );
};
