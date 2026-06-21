"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { drawGrid } from '../utils';

interface SimProps {
  isPlaying: boolean;
  isGridVisible: boolean;
  isVectorVisible: boolean;
  simSpeed: number;
  parameters: Record<string, number>;
  onRecordData: (data: any) => void;
  stepTrigger?: number;
}

export const HollowBallCollision: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData,
  stepTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read parameters (or fallback to default values from the physics problem)
  const v0 = parameters.v0 ?? 11;
  const g = parameters.g ?? 10;
  const D = parameters.D ?? 0.25;
  const d = parameters.d ?? 0.05;
  const massRatio = parameters.massRatio ?? 3.0;
  const H = 6.0; // Distance to ceiling initially

  // Local state for current time and active solver stage
  const [colTime, setColTime] = useState<number>(0.0);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // 1. Analytical Physics Engine (precomputes all collision event points dynamically)
  const physicsData = useMemo(() => {
    const list: any[] = [];
    const term = v0 * v0 - 2 * g * H;
    if (term < 0) {
      return {
        events: [],
        t1: 0,
        dt_col: 0,
        alpha: 0,
        error: "初速度过低或重力过大，球壳无法触及天花板！",
        t_land: 0,
        vs_land: 0
      };
    }
    
    // Time to hit the ceiling
    const t_ceil = (v0 - Math.sqrt(term)) / g;
    const vs_ceil_minus = v0 - g * t_ceil;
    const vs_ceil_plus = -vs_ceil_minus;
    const yb_ceil = H + d / 2;
    const vb_ceil = vs_ceil_minus;

    list.push({
      t: t_ceil,
      ys: H,
      vs: vs_ceil_plus,
      yb: yb_ceil,
      vb: vb_ceil,
      type: 'ceiling',
      colCount: 0
    });

    const v_rel = vb_ceil - vs_ceil_plus; // 2 * vs_ceil_minus
    if (v_rel <= 0) {
      return {
        events: list,
        t1: t_ceil,
        dt_col: 0,
        alpha: 0,
        error: "相对速度异常，无法发生后续碰撞！",
        t_land: t_ceil,
        vs_land: vs_ceil_plus
      };
    }

    const dt = (D - d) / v_rel;
    const alphVal = (1 - massRatio) / (1 + massRatio);

    let currentT = t_ceil;
    let currentYs = H;
    let currentVs = vs_ceil_plus;
    let currentYb = yb_ceil;
    let currentVb = vb_ceil;
    let colCount = 0;
    let finalLandT = t_ceil;
    let finalLandVs = vs_ceil_plus;
    let finalLandVb = vb_ceil;
    let finalLandYb = yb_ceil;

    // Simulate up to 50 collisions or until it lands
    while (colCount < 50) {
      // Check if ground collision happens before next internal collision
      // -0.5 * g * t'^2 + currentVs * t' + currentYs = 0
      // 0.5 * g * t'^2 - currentVs * t' - currentYs = 0
      const disc = currentVs * currentVs + 2 * g * currentYs;
      let t_prime = Infinity;
      if (disc >= 0) {
        const root = (currentVs + Math.sqrt(disc)) / g;
        if (root > 0) {
          t_prime = root;
        }
      }

      if (t_prime <= dt) {
        // Lands!
        finalLandT = currentT + t_prime;
        finalLandVs = currentVs - g * t_prime;
        finalLandVb = currentVb - g * t_prime;
        finalLandYb = currentYb + currentVb * t_prime - 0.5 * g * t_prime * t_prime;
        
        list.push({
          t: finalLandT,
          ys: 0,
          vs: finalLandVs,
          yb: finalLandYb,
          vb: finalLandVb,
          type: 'land',
          colCount
        });
        break;
      }

      // Next collision
      currentT += dt;
      const ys_minus = currentYs + currentVs * dt - 0.5 * g * dt * dt;
      const yb_minus = currentYb + currentVb * dt - 0.5 * g * dt * dt;
      const vs_minus = currentVs - g * dt;
      const vb_minus = currentVb - g * dt;

      // Elastic collision
      const vs_plus = alphVal * vs_minus + (1 - alphVal) * vb_minus;
      const vb_plus = (1 + alphVal) * vs_minus - alphVal * vb_minus;

      colCount++;
      list.push({
        t: currentT,
        ys: ys_minus,
        vs: vs_plus,
        yb: yb_minus,
        vb: vb_plus,
        type: 'internal',
        colCount
      });

      currentYs = ys_minus;
      currentVs = vs_plus;
      currentYb = yb_minus;
      currentVb = vb_plus;
    }

    return {
      events: list,
      t1: t_ceil,
      dt_col: dt,
      alpha: alphVal,
      error: null,
      t_land: finalLandT,
      vs_land: finalLandVs
    };
  }, [v0, g, D, d, massRatio]);

  const { events, t1, dt_col, error, t_land } = physicsData;

  // 2. State at arbitrary time
  const getPhysicsState = (t: number) => {
    if (error || events.length === 0) {
      return { ys: 0, vs: 0, yb: 0, vb: 0, colCount: 0, stage: 1 };
    }
    const clampedT = Math.max(0, Math.min(t, t_land));

    if (clampedT <= t1) {
      const ys = v0 * clampedT - 0.5 * g * clampedT * clampedT;
      const vs = v0 - g * clampedT;
      const yb = ys + d / 2;
      const vb = vs;
      return { ys, vs, yb, vb, colCount: 0, stage: 1 };
    }

    let activeEvent = events[0];
    for (let i = 0; i < events.length; i++) {
      if (events[i].t <= clampedT) {
        activeEvent = events[i];
      } else {
        break;
      }
    }

    if (activeEvent.type === 'land') {
      return {
        ys: 0,
        vs: activeEvent.vs,
        yb: activeEvent.yb,
        vb: activeEvent.vb,
        colCount: activeEvent.colCount,
        stage: 3
      };
    }

    const dt = clampedT - activeEvent.t;
    const ys = activeEvent.ys + activeEvent.vs * dt - 0.5 * g * dt * dt;
    const yb = activeEvent.yb + activeEvent.vb * dt - 0.5 * g * dt * dt;
    const vs = activeEvent.vs - g * dt;
    const vb = activeEvent.vb - g * dt;

    let stage = 3;
    if (clampedT <= t1 + dt_col) {
      stage = 2;
    }

    return { ys, vs, yb, vb, colCount: activeEvent.colCount, stage };
  };

  const currentState = getPhysicsState(colTime);

  // 3. Playback timer
  useEffect(() => {
    if (error) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      const elapsed = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (isPlayingRef.current) {
        setColTime(prev => {
          const next = prev + elapsed * simSpeed;
          if (next >= t_land) {
            isPlayingRef.current = false;
            onRecordData({ isPlaying: false });
            return t_land;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, simSpeed, t_land, error]);

  useEffect(() => {
    setColTime(0.0);
  }, [parameters, stepTrigger]);

  const lastStepTrigger = useRef(stepTrigger);
  useEffect(() => {
    if (stepTrigger !== undefined && stepTrigger !== lastStepTrigger.current) {
      lastStepTrigger.current = stepTrigger;
      setColTime(prev => Math.min(t_land, prev + 0.02));
    }
  }, [stepTrigger, t_land]);

  // 4. Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (isGridVisible) {
      drawGrid(ctx, w, h, 40, '#111827');
    }

    if (error) {
      ctx.fillStyle = '#ff003c';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(error, w / 2, h / 2);
      return;
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, 0);
    ctx.lineTo(180, h);
    ctx.stroke();

    // LEFT: Macroscopic View
    const macroX = 90;
    const groundY = 430;
    const ceilingY = groundY - (H + D) * 60;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath(); 
    ctx.moveTo(20, groundY); 
    ctx.lineTo(160, groundY); 
    ctx.stroke();

    ctx.strokeStyle = 'var(--accent-secondary)';
    ctx.beginPath(); 
    ctx.moveTo(20, ceilingY); 
    ctx.lineTo(160, ceilingY); 
    ctx.stroke();

    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '10px var(--font-sans)';
    ctx.textAlign = 'left';
    ctx.fillText(`天花板 (${(H + D).toFixed(2)}m)`, 25, ceilingY - 8);
    ctx.fillText('地面 (0.00m)', 25, groundY + 16);

    const shellBottomY = groundY - currentState.ys * 60;
    const shellTopY = groundY - (currentState.ys + D) * 60;
    const shellCenterY = (shellBottomY + shellTopY) / 2;
    const shellRadiusPixel = (D / 2) * 60;

    ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(macroX, shellCenterY, Math.max(4, shellRadiusPixel), 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    const ballCenterY = groundY - currentState.yb * 60;
    const ballRadiusPixel = (d / 2) * 60;
    ctx.fillStyle = 'var(--warning)';
    ctx.beginPath();
    ctx.arc(macroX, ballCenterY, Math.max(2.2, ballRadiusPixel), 0, 2 * Math.PI);
    ctx.fill();

    // RIGHT: Zoomed Relative View
    const zoomX = 410;
    const zoomY = 240;
    const zoomR = 120;

    const shellGrad = ctx.createRadialGradient(zoomX - 30, zoomY - 30, 15, zoomX, zoomY, zoomR);
    shellGrad.addColorStop(0, 'rgba(10, 10, 10, 0.15)');
    shellGrad.addColorStop(0.85, 'rgba(0, 243, 255, 0.08)');
    shellGrad.addColorStop(1, 'rgba(0, 243, 255, 0.45)');

    ctx.fillStyle = shellGrad;
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 3.5;
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'var(--accent-glow)';
    ctx.beginPath();
    ctx.arc(zoomX, zoomY, zoomR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (currentState.ys > H - 0.15) {
      const ceilOffset = (((H + D) - (currentState.ys + D)) / 0.15) * 90;
      const ceilDrawY = zoomY - zoomR + ceilOffset;
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(zoomX - 90, ceilDrawY);
      ctx.lineTo(zoomX + 90, ceilDrawY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 0, 60, 0.4)';
      ctx.lineWidth = 1.5;
      for (let hx = zoomX - 80; hx <= zoomX + 80; hx += 12) {
        ctx.beginPath(); 
        ctx.moveTo(hx, ceilDrawY); 
        ctx.lineTo(hx + 5, ceilDrawY - 5); 
        ctx.stroke();
      }
    }

    if (currentState.ys < 0.15) {
      const floorOffset = ((0 - currentState.ys) / 0.15) * 90;
      const floorDrawY = zoomY + zoomR + floorOffset;
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(zoomX - 90, floorDrawY);
      ctx.lineTo(zoomX + 90, floorDrawY);
      ctx.stroke();
    }

    const y_rel = currentState.yb - (currentState.ys + D / 2);
    const maxRelDisplacement = (D - d) / 2;
    const ballZoomY = zoomY - (y_rel / (maxRelDisplacement || 0.1)) * (zoomR - 24);
    const ballR = 24;

    const ballGrad = ctx.createRadialGradient(zoomX - 6, ballZoomY - 6, 3, zoomX, ballZoomY, ballR);
    ballGrad.addColorStop(0, '#fef08a');
    ballGrad.addColorStop(0.3, '#f59e0b');
    ballGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = ballGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
    ctx.beginPath();
    ctx.arc(zoomX, ballZoomY, ballR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '500 11px var(--font-sans)';
    ctx.textAlign = 'center';
    ctx.fillText(`球壳 M (D = ${D.toFixed(2)}m)`, zoomX, zoomY + zoomR + 20);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`小球 m (d = ${d.toFixed(2)}m)`, zoomX, ballZoomY + (ballZoomY > zoomY ? -30 : 38));

    if (isVectorVisible) {
      drawVelocityArrow(ctx, zoomX - zoomR - 25, zoomY, currentState.vs, 'var(--accent-secondary)', 'v_s');
      drawVelocityArrow(ctx, zoomX + zoomR + 25, ballZoomY, currentState.vb, '#f59e0b', 'v_b');
    }
  }, [colTime, isGridVisible, isVectorVisible, events, t1, dt_col, error, parameters, D, d]);

  const drawVelocityArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    velocity: number,
    color: string,
    labelText: string
  ) => {
    const mag = Math.abs(velocity);
    if (mag < 0.05) return;

    const arrowLength = Math.min(50, 15 + mag * 3);
    const direction = velocity > 0 ? -1 : 1;

    const endY = y + direction * arrowLength;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, endY);
    ctx.stroke();

    const headSize = 8;
    ctx.beginPath();
    ctx.moveTo(x, endY);
    ctx.lineTo(x - headSize / 2, endY - direction * headSize);
    ctx.lineTo(x + headSize / 2, endY - direction * headSize);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = 'bold 10px var(--font-mono)';
    ctx.textAlign = 'left';
    ctx.fillText(`${labelText}=${velocity.toFixed(2)}`, x + (x > 410 ? 12 : -65), (y + endY) / 2 + 3);
  };

  const handleStageJump = (stage: number) => {
    if (error) return;
    if (stage === 1) {
      setColTime(0.0);
    } else if (stage === 2) {
      setColTime(t1 + 0.002);
    } else if (stage === 3) {
      setColTime(t1 + dt_col + 0.002);
    }
  };

  const customStyles = `
  .hollow-ball-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  .hollow-ball-controls {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    padding: 16px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .slider-container {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  .timeline-slider {
    flex-grow: 1;
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    outline: none;
    accent-color: var(--accent);
  }
  .stage-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .stage-btn {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .stage-btn:hover {
    background: var(--border-color);
    color: var(--text-primary);
  }
  .stage-btn.active {
    background: rgba(0, 243, 255, 0.15) !important;
    border-color: var(--accent) !important;
    color: var(--accent) !important;
    box-shadow: 0 0 10px var(--accent-glow);
  }
  .telemetry-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 12px;
    border-radius: 8px;
  }
  .tele-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tele-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .tele-val {
    font-size: 1.1rem;
    font-weight: 700;
    font-family: var(--font-mono);
  }
  .text-cyan { color: var(--accent); }
  .text-amber { color: #f59e0b; }
  .text-green { color: var(--success); }

  .solver-container {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    padding: 16px;
    border-radius: 8px;
    margin-top: 12px;
  }
  .solver-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    background: rgba(0, 0, 0, 0.2);
    padding: 4px;
    border-radius: 6px;
  }
  .solver-tab-btn {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 600;
    padding: 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: all var(--transition-fast);
  }
  .solver-tab-btn:hover {
    color: var(--text-primary);
  }
  .solver-tab-btn.active {
    background: var(--bg-secondary);
    color: var(--accent);
  }
  .solver-content-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 16px;
    border-radius: 6px;
  }
  .solver-formula-block {
    font-family: var(--font-mono);
    background: rgba(0, 0, 0, 0.25);
    border: 1px dashed var(--border-color);
    padding: 10px;
    border-radius: 4px;
    text-align: center;
    color: var(--accent);
    margin: 12px 0;
    font-size: 0.95rem;
  }
  .solver-step-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 20px;
    margin: 0;
  }
  .solver-step-item {
    color: var(--text-secondary);
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .solver-step-item strong {
    color: var(--text-primary);
  }
  `;

  return (
    <div className="hollow-ball-container">
      <style>{customStyles}</style>

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="simulation-canvas"
      />

      <div className="hollow-ball-controls">
        <div className="slider-container">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '45px' }}>
            {colTime.toFixed(3)}s
          </span>
          <input
            type="range"
            min="0.0"
            max={t_land || 2.138}
            step="0.001"
            value={colTime}
            onChange={(e) => {
              onRecordData({ isPlaying: false });
              setColTime(parseFloat(e.target.value));
            }}
            className="timeline-slider"
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'right' }}>
            {t_land.toFixed(3)}s
          </span>
        </div>

        <div className="stage-buttons">
          <button
            onClick={() => handleStageJump(1)}
            className={`stage-btn ${currentState.stage === 1 ? 'active' : ''}`}
          >
            ① 上升阶段 (0.00s)
          </button>
          <button
            onClick={() => handleStageJump(2)}
            className={`stage-btn ${currentState.stage === 2 ? 'active' : ''}`}
          >
            ② 首次内碰 (1.002s)
          </button>
          <button
            onClick={() => handleStageJump(3)}
            className={`stage-btn ${currentState.stage === 3 ? 'active' : ''}`}
          >
            ③ 下落碰撞 (1.102s)
          </button>
        </div>

        <div className="telemetry-grid">
          <div className="tele-item">
            <span className="tele-label">球壳高度 y_s</span>
            <span className="tele-val text-cyan">{currentState.ys.toFixed(3)} m</span>
          </div>
          <div className="tele-item">
            <span className="tele-label">球壳速度 v_s</span>
            <span className="tele-val text-cyan">{currentState.vs.toFixed(2)} m/s</span>
          </div>
          <div className="tele-item">
            <span className="tele-label">小球高度 y_b</span>
            <span className="tele-val text-amber">{currentState.yb.toFixed(3)} m</span>
          </div>
          <div className="tele-item">
            <span className="tele-label">小球速度 v_b</span>
            <span className="tele-val text-amber">{currentState.vb.toFixed(2)} m/s</span>
          </div>
          <div className="tele-item">
            <span className="tele-label">相对速度 v_rel (v_b - v_s)</span>
            <span className="tele-val text-green">{(currentState.vb - currentState.vs).toFixed(2)} m/s</span>
          </div>
          <div className="tele-item">
            <span className="tele-label">内部已碰撞次数</span>
            <span className="tele-val text-green">{currentState.colCount} 次</span>
          </div>
        </div>
      </div>

      <div className="solver-container">
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--accent)', borderRadius: '2px' }}></span>
          多阶段运动解析与手把手题解
        </h3>

        <div className="solver-tabs">
          <button
            onClick={() => setActiveStepTab(1)}
            className={`solver-tab-btn ${activeStepTab === 1 ? 'active' : ''}`}
          >
            一阶段：上升与天顶碰撞
          </button>
          <button
            onClick={() => setActiveStepTab(2)}
            className={`solver-tab-btn ${activeStepTab === 2 ? 'active' : ''}`}
          >
            二阶段：小球直径与首次内碰
          </button>
          <button
            onClick={() => setActiveStepTab(3)}
            className={`solver-tab-btn ${activeStepTab === 3 ? 'active' : ''}`}
          >
            三阶段：连续碰撞与落地速度
          </button>
        </div>

        <div className="solver-content-card">
          {activeStepTab === 1 && (
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '8px' }}>
                第一阶段：上升阶段与天花板发生弹性碰撞 (t ∈ [0, 1.0] s)
              </h4>
              <ul className="solver-step-list">
                <li className="solver-step-item">
                  <strong>两体相对静止：</strong>上升时，球壳与小球均仅受重力作用，其加速度均为 -g，小球静止于球壳底部（两中心相距 d/2 = {d} m）。
                </li>
                <li className="solver-step-item">
                  <strong>触碰天花板时刻 t₁ 计算：</strong>球壳顶端距天花板高度为 H = {H} m。根据位移方程可列出：
                  <div className="solver-formula-block">
                    {`y_s(t_1) = v_0 t_1 - \\frac{1}{2} g t_1^2 = H \\implies ${v0} t_1 - ${g/2} t_1^2 = ${H}`}
                  </div>
                  代入数据求出：5 t₁² - 11 t₁ + 6 = 0，解得 <strong>t₁ = 1.0 s</strong>。
                </li>
                <li className="solver-step-item">
                  <strong>碰撞后的速度剧变：</strong>碰撞前一瞬间，球壳速度为 v_s = {v0} - {g} × 1 = 1 m/s。球壳与天花板发生弹性碰撞后以原速率反弹，速度立即变为 <strong>-1 m/s</strong>（向下）。小球由于没有直接撞击天花板，其速度依然保持为 <strong>1 m/s</strong>（向上）。
                </li>
                <li className="solver-step-item">
                  <strong>相对速度的产生：</strong>反弹后，小球与球壳的相对速度变为：
                  <div className="solver-formula-block">
                    {`v_{\\text{rel}} = v_b - v_s = 1 - (-1) = 2\\text{ m/s}`}
                  </div>
                </li>
              </ul>
            </div>
          )}

          {activeStepTab === 2 && (
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '8px' }}>
                第二阶段：天花板撞后首次内部碰撞 (t ∈ [1.0, 1.1] s)
              </h4>
              <ul className="solver-step-list">
                <li className="solver-step-item">
                  <strong>内壁相撞的过程：</strong>碰撞天花板后，球壳与小球相对以 v_rel = 2 m/s 做相对匀速靠近。当小球顶部触碰到球壳内部顶壁时触发相撞，相对位移大小为 D - d。
                </li>
                <li className="solver-step-item">
                  <strong>第一小问解答（求小球直径 d）：</strong>本仿真支持任意参数，以默认参数为例，已知反弹后经过 Δt = 0.1 s 小球与球壳发生碰撞，根据相对运动公式列出：
                  <div className="solver-formula-block">
                    {`\\Delta t = \\frac{D - d}{v_{\\text{rel}}} \\implies 0.1 = \\frac{${D} - d}{2} \\implies d = 0.05\\text{ m}`}
                  </div>
                  求出小球直径为 <strong>0.05 m</strong> (即 5 cm)。
                </li>
                <li className="solver-step-item">
                  <strong>第二小问解答（求一碰后的相对速度与第二次碰撞间隔）：</strong>
                  <br />
                  ① <strong>碰后相对速度：</strong>由于两体在球壳内部发生的是完全弹性碰撞，且在此阶段无其它外力冲量，根据完全弹性碰撞性质，碰撞前后两物体的<strong>相对速度大小守恒</strong>，仍为 <strong>2 m/s</strong>（方向反转）。
                  <br />
                  ② <strong>第二次碰撞间隔：</strong>碰撞后小球向下反弹，直到它撞击球壳底壁。其相对位移大小依然为 D - d = 0.20 m，相对速度大小依然为 2 m/s，故第二次碰撞间隔为：
                  <div className="solver-formula-block">
                    {`\\Delta t_2 = \\frac{D - d}{v_{\\text{rel}}} = \\frac{0.20}{2} = 0.1\\text{ s}`}
                  </div>
                </li>
              </ul>
            </div>
          )}

          {activeStepTab === 3 && (
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '8px' }}>
                第三阶段：连续往复碰撞与着陆速度计算 (t ∈ [1.1, {t_land.toFixed(3)}] s)
              </h4>
              <ul className="solver-step-list">
                <li className="solver-step-item">
                  <strong>第三小问解答（质量比 m/M 倒推）：</strong>
                  已知在第 8 次碰撞前一瞬间球壳速度大小为 6 m/s (即 v_s,8⁻ = -6 m/s)。根据弹性碰撞的动量守恒和能量守恒，每次碰撞后的速度递推公式为：
                  <div className="solver-formula-block">
                    {`v_s^+ = \\alpha v_s^- + (1-\\alpha)v_b^- \\quad \\text{其中} \\quad \\alpha = \\frac{M - m}{M + m}`}
                  </div>
                  依次代入递推关系得到 α = -0.5，从而推得质量比 <strong>m/M = 3.0</strong>。
                </li>
                <li className="solver-step-item">
                  <strong>第11次碰撞后的状态：</strong>以默认参数为例，在 t = 2.1 s 时发生第 11 次碰撞。此时的球壳底端高度为 y_s = 0.35 m，碰撞后的速度为 v_s = -9.0 m/s（向下）。
                </li>
                <li className="solver-step-item">
                  <strong>第三小问最终落地速度（v_land）：</strong>球壳底端从当前状态下最后一碰的 y_s = 0.35 m 开始下落，直到触地（y_s = 0 m）。在此过程中只受重力，由动能定理/运动学公式得出落地速度为：
                  <div className="solver-formula-block">
                    {`v_{\\text{land}} = \\sqrt{(v_{s,11}^+)^2 - 2g(0 - y_{s,11})} = \\sqrt{(-9.0)^2 - 2 \\times 10 \\times (0 - 0.35)} = \\sqrt{88}\\text{ m/s} \\approx 9.38\\text{ m/s}`}
                  </div>
                  对应的落地时间为：t_land = 2.1 + 0.038 = <strong>2.138 s</strong>。
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
