"use client";
import React, { useEffect, useRef, useState } from 'react';
import { drawGrid, drawLabel, getEventCoords } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

interface Weight {
  id: string;
  mass: number; // in grams (e.g. 50, 100, 200)
  color: string;
  // Position
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  
  // Placement state
  status: 'bin' | 'left-hook' | 'right-hook';
  pegIndex?: number; // 0 to 4 (representing distances 1 to 5)
}

export const LeverBalance: React.FC<SimProps> = ({
  isGridVisible,
  parameters,
  onRecordData,
  stepTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReleased, setIsReleased] = useState<boolean>(false);
  
  // Weights state managed in a ref to keep Canvas loop high-performance
  const weightsRef = useRef<Weight[]>([
    { id: 'w1', mass: 50, color: '#10b981', x: 80, y: 310, initialX: 80, initialY: 310, status: 'bin' },
    { id: 'w2', mass: 100, color: '#3b82f6', x: 160, y: 310, initialX: 160, initialY: 310, status: 'bin' },
    { id: 'w3', mass: 100, color: '#3b82f6', x: 240, y: 310, initialX: 240, initialY: 310, status: 'bin' },
    { id: 'w4', mass: 200, color: '#f43f5e', x: 320, y: 310, initialX: 320, initialY: 310, status: 'bin' },
    { id: 'w5', mass: 200, color: '#f43f5e', x: 400, y: 310, initialX: 400, initialY: 310, status: 'bin' }
  ]);

  const activeWeightIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const lastStepTriggerRef = useRef<number | undefined>(undefined);

  // Listen to stepTrigger from parent to handle reset actions
  useEffect(() => {
    if (stepTrigger === 0 && lastStepTriggerRef.current !== 0) {
      setIsReleased(false);
      weightsRef.current.forEach(w => {
        w.status = 'bin';
        w.x = w.initialX;
        w.y = w.initialY;
      });
      // Call initial data sync
      onRecordData({
        leftTorque: 0,
        rightTorque: 0,
        isBalanced: '是'
      });
    }
    lastStepTriggerRef.current = stepTrigger;
  }, [stepTrigger]);

  // Calculate torque for both sides
  // Torque T = mass * distance * g (we can omit g to simplify to Mass * Units)
  const getTorques = () => {
    let leftTorque = 0;
    let rightTorque = 0;

    weightsRef.current.forEach(w => {
      if (w.status === 'left-hook' && w.pegIndex !== undefined) {
        // Left pegIndex is 0 to 4 (distance 1 to 5)
        const distance = w.pegIndex + 1;
        leftTorque += w.mass * distance;
      } else if (w.status === 'right-hook' && w.pegIndex !== undefined) {
        // Right pegIndex is 0 to 4 (distance 1 to 5)
        const distance = w.pegIndex + 1;
        rightTorque += w.mass * distance;
      }
    });

    return { leftTorque, rightTorque };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync initial torques on mount
    const { leftTorque, rightTorque } = getTorques();
    onRecordData({
      leftTorque,
      rightTorque,
      isBalanced: leftTorque === rightTorque ? '是' : '否'
    });

    let animId: number;
    let angle = 0; // Current rotation angle of the lever in radians

    // Reset rotation if locked
    if (!isReleased) {
      angle = 0;
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = 180; // Fulcrum Y coordinate
      const beamHalfLen = 220; // Half length of lever beam
      const pegSpacing = 40; // Spacing between hooks

      ctx.clearRect(0, 0, w, h);

      // 1. Grid
      if (isGridVisible) {
        drawGrid(ctx, w, h, 40, '#111827');
      }

      // Calculate balance behavior if released
      const { leftTorque, rightTorque } = getTorques();
      
      if (isReleased) {
        // Determine target angle based on torque difference
        let targetAngle = 0;
        if (leftTorque > rightTorque) {
          targetAngle = -0.18; // Tilt left
        } else if (leftTorque < rightTorque) {
          targetAngle = 0.18;  // Tilt right
        } else {
          targetAngle = 0;     // Balanced
        }
        // Smoothly interpolate angle
        angle += (targetAngle - angle) * 0.1;
      } else {
        angle = 0; // Lock
      }

      // 2. Draw Stand / Support
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 25, cy + 90);
      ctx.lineTo(cx + 25, cy + 90);
      ctx.closePath();
      ctx.fill();

      // Stand base
      ctx.fillRect(cx - 50, cy + 90, 100, 8);

      // 3. Draw Lever Beam (Rotated)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Main beam
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-beamHalfLen, -8, beamHalfLen * 2, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Center peg point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw hooks/pegs
      // 5 hooks on the left (-pegSpacing * 1 to -5), 5 on the right
      const drawPegsForSide = (side: 'left' | 'right') => {
        ctx.fillStyle = '#1e293b';
        ctx.font = '8px var(--font-sans)';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < 5; i++) {
          const distPx = (i + 1) * pegSpacing;
          const px = side === 'left' ? -distPx : distPx;
          
          // Draw peg dot
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(px, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw hook wire down
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, 10);
          ctx.stroke();

          // Hook numbers (1 to 5)
          ctx.fillStyle = 'var(--text-secondary)';
          ctx.fillText(`${i + 1}`, px, -14);
        }
      };

      drawPegsForSide('left');
      drawPegsForSide('right');

      // Update positions of attached weights based on rotated beam
      const pegIndices: Record<string, number> = {};
      weightsRef.current.forEach(w => {
        if (w.status === 'left-hook' && w.pegIndex !== undefined) {
          const key = `left-${w.pegIndex}`;
          const idx = pegIndices[key] || 0;
          pegIndices[key] = idx + 1;

          const pegX = -(w.pegIndex + 1) * pegSpacing;
          const offsetDrop = 15 + idx * 28; // Stack multiple weights vertically
          w.x = cx + pegX * Math.cos(angle) - offsetDrop * Math.sin(angle);
          w.y = cy + pegX * Math.sin(angle) + offsetDrop * Math.cos(angle);
        } else if (w.status === 'right-hook' && w.pegIndex !== undefined) {
          const key = `right-${w.pegIndex}`;
          const idx = pegIndices[key] || 0;
          pegIndices[key] = idx + 1;

          const pegX = (w.pegIndex + 1) * pegSpacing;
          const offsetDrop = 15 + idx * 28; // Stack multiple weights vertically
          w.x = cx + pegX * Math.cos(angle) - offsetDrop * Math.sin(angle);
          w.y = cy + pegX * Math.sin(angle) + offsetDrop * Math.cos(angle);
        }
      });

      ctx.restore(); // Restore context rotation

      // 4. Draw Weights
      weightsRef.current.forEach(w => {
        ctx.save();
        ctx.fillStyle = w.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1.5;
        
        // Draw weight block (standard rectangular block with a hook ring)
        const size = w.mass === 50 ? 20 : w.mass === 100 ? 25 : 30;
        
        // Top ring
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(w.x, w.y - size / 2, 5, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.roundRect(w.x - size / 2, w.y - size / 2, size, size, 4);
        ctx.fill();
        ctx.stroke();

        // Text label showing mass
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${w.mass}g`, w.x, w.y);
        ctx.restore();
      });

      // 5. Draw Weight Rack / Bin line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 340);
      ctx.lineTo(w - 30, 340);
      ctx.stroke();
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('砝码架 (拖拽上方砝码到杠杆悬挂)', 40, h - 35);

      // 6. Draw Torque readout
      // We calculate torque as Mass (g) * Dist (Units). Torque balance formula is FL = FR.
      const valL = leftTorque;
      const valR = rightTorque;
      drawLabel(ctx, `左侧力矩: ${valL} g·格`, 40, 20, '12px var(--font-sans)', '#10b981');
      drawLabel(ctx, `右侧力矩: ${valR} g·格`, w - 160, 20, '12px var(--font-sans)', '#f43f5e');

      // Status label
      let statusText = '杠杆已锁定';
      let statusColor = 'var(--text-secondary)';
      if (isReleased) {
        if (valL === valR) {
          statusText = '平衡状态 (力与力臂乘积相等)';
          statusColor = 'var(--success)';
        } else {
          statusText = '不平衡状态';
          statusColor = 'var(--error)';
        }
      }
      drawLabel(ctx, statusText, cx - 80, 20, '12px var(--font-sans)', statusColor);

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Drag handlers supporting mouse and touch events
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      // Find if we clicked on any weight
      let clickedWeight: Weight | null = null;
      weightsRef.current.forEach(w => {
        const size = w.mass === 50 ? 20 : w.mass === 100 ? 25 : 30;
        if (
          mx >= w.x - size && mx <= w.x + size &&
          my >= w.y - size && my <= w.y + size
        ) {
          clickedWeight = w;
        }
      });

      if (clickedWeight) {
        activeWeightIdRef.current = (clickedWeight as Weight).id;
        dragOffsetRef.current = {
          x: mx - (clickedWeight as Weight).x,
          y: my - (clickedWeight as Weight).y
        };
        // Reset state so it's not locked to the hook while dragging
        (clickedWeight as Weight).status = 'bin';
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const activeId = activeWeightIdRef.current;
      if (!activeId) return;
      if (e.cancelable) e.preventDefault();

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      const wNode = weightsRef.current.find(w => w.id === activeId);
      if (!wNode) return;

      // Update dragged weight coordinates
      wNode.x = mx - dragOffsetRef.current.x;
      wNode.y = my - dragOffsetRef.current.y;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      const activeId = activeWeightIdRef.current;
      if (!activeId) return;

      activeWeightIdRef.current = null;

      const wNode = weightsRef.current.find(w => w.id === activeId);
      if (!wNode) return;

      const coords = getEventCoords(e, canvas);
      const mx = coords.x;
      const my = coords.y;

      const cx = canvas.width / 2;
      const cy = 180;
      const pegSpacing = 40;

      // Check snapping to hooks (hooks are located at cy, Y offset is about 20px down)
      // Snap range: Y must be close to cy (+10 to +40), X must be close to a peg index
      const deltaY = my - cy;
      
      let snapped = false;

      // Only snap if Y is near the beam line
      if (deltaY > -30 && deltaY < 60) {
        const deltaX = mx - cx;
        
        // Find which peg index matches (peg distance is 1 to 5, spaced at pegSpacing)
        // Peg position = pegIndex * pegSpacing
        const side = deltaX < 0 ? 'left' : 'right';
        const absDeltaX = Math.abs(deltaX);
        
        // Find closest hook index (0 to 4)
        let closestIndex = Math.round(absDeltaX / pegSpacing) - 1;
        
        if (closestIndex >= 0 && closestIndex <= 4) {
          // Verify distance to peg is within snap bounds (e.g. 20px)
          const pegX = (closestIndex + 1) * pegSpacing;
          const targetX = side === 'left' ? -pegX : pegX;
          const distToPeg = Math.abs(absDeltaX - pegX);
          
          if (distToPeg < 20) {
            wNode.status = side === 'left' ? 'left-hook' : 'right-hook';
            wNode.pegIndex = closestIndex;
            snapped = true;
          }
        }
      }

      if (!snapped) {
        // Reset to initial bin spot
        wNode.status = 'bin';
        wNode.x = wNode.initialX;
        wNode.y = wNode.initialY;
      }

      // Record data callback
      const { leftTorque, rightTorque } = getTorques();
      onRecordData({
        leftTorque,
        rightTorque,
        isBalanced: leftTorque === rightTorque ? '是' : '否'
      });
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
  }, [isReleased, isGridVisible]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="simulation-canvas"
      />
      {/* Control buttons inside visualizer overlay */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setIsReleased(!isReleased)}
          className={`btn ${isReleased ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
        >
          {isReleased ? "锁定杠杆" : "释放杠杆"}
        </button>
      </div>
    </div>
  );
};
