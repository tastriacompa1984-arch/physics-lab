"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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

export const SoundWaves: React.FC<SimProps> = ({
  isPlaying,
  isGridVisible,
  isVectorVisible,
  simSpeed,
  parameters,
  onRecordData
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(false);
  
  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Read parameters
  const freq = parameters.frequency ?? 440; // Hz
  const amp = parameters.amplitude ?? 5;     // 1 to 10
  const waveType = parameters.waveType ?? 0; // 0: sine, 1: square, 2: triangle

  // Handle Audio Toggling
  const toggleAudio = () => {
    if (!isAudioOn) {
      // Initialize AudioContext
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Configure oscillator type based on parameter
        const types: OscillatorType[] = ['sine', 'square', 'triangle'];
        osc.type = types[Math.round(waveType)] || 'sine';
        osc.frequency.value = freq;

        // Configure gain based on amplitude parameter (max volume 0.1 to prevent discomfort)
        gain.gain.value = (amp / 10) * 0.05;

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        audioCtxRef.current = ctx;
        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setIsAudioOn(true);
      } catch (err) {
        console.error("Web Audio API not supported or blocked: ", err);
      }
    } else {
      stopAudio();
    }
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current.disconnect();
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    oscillatorRef.current = null;
    gainNodeRef.current = null;
    setIsAudioOn(false);
  };

  // Keep Audio synchronized with sliders
  useEffect(() => {
    if (isAudioOn && oscillatorRef.current && gainNodeRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(freq, audioCtxRef.current!.currentTime);
      gainNodeRef.current.gain.setValueAtTime((amp / 10) * 0.05, audioCtxRef.current!.currentTime);
      
      const types: OscillatorType[] = ['sine', 'square', 'triangle'];
      oscillatorRef.current.type = types[Math.round(waveType)] || 'sine';
    }
  }, [freq, amp, waveType, isAudioOn]);

  // Clean up Audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Canvas Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Air molecules array for the speaker compression animation
    const numMolecules = 220;
    const molecules: { x: number; y: number; baseX: number }[] = [];
    
    // Distribute molecules on the right side of the speaker
    const startX = 220;
    const endX = 640;
    const height = 360;

    for (let i = 0; i < numMolecules; i++) {
      const bx = startX + Math.random() * (endX - startX);
      molecules.push({
        x: bx,
        y: Math.random() * height,
        baseX: bx
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

      // Speaker boundingbox coordinates
      const speakerX = 100;
      const speakerY = 180;
      const coneSize = 60;

      // Update phase/time if playing
      if (isPlaying) {
        // Higher frequency sound waves oscillate faster
        time += simSpeed * (freq / 440) * 0.15;
      }

      // 2. Air molecules animation (Compression & Rarefaction)
      // Sound travels through air as pressure waves: s(x,t) = s_m cos(kx - wt)
      // Wavelength lambda is inversely proportional to frequency
      const speedOfSound = 150; // pixels per unit time
      const wavelength = speedOfSound / (freq / 440 + 0.1);
      const waveNumber = (2 * Math.PI) / wavelength;
      const omega = 1; // Speed of phase shift
      const maxDisplacement = amp * 2.5; // proportional to amplitude

      // Update molecule positions
      molecules.forEach(m => {
        const distanceToSpeaker = m.baseX - speakerX;
        
        // Calculate phase based on base position and time
        const phase = waveNumber * distanceToSpeaker - time;
        const disp = Math.sin(phase) * maxDisplacement;
        
        m.x = m.baseX + disp;
      });

      // Draw molecules
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      molecules.forEach(m => {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Speaker
      ctx.save();
      // Draw speaker cabinet
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(speakerX - 80, speakerY - 90, 80, 180, 8);
      ctx.fill();
      ctx.stroke();

      // Vibrating cone displacement
      const coneDisp = Math.sin(-time) * (amp / 10) * 8;
      
      // Draw cone
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(speakerX - 10, speakerY - coneSize);
      ctx.lineTo(speakerX + coneDisp, speakerY - coneSize / 2);
      ctx.lineTo(speakerX + coneDisp, speakerY + coneSize / 2);
      ctx.lineTo(speakerX - 10, speakerY + coneSize);
      ctx.closePath();
      ctx.fill();

      // Speaker driver circle
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(speakerX - 40, speakerY - 40, 20, 0, Math.PI * 2);
      ctx.arc(speakerX - 40, speakerY + 40, 20, 0, Math.PI * 2);
      ctx.fill();

      // Vibrating speaker cap
      ctx.fillStyle = '#f43f5e'; // Red cap vibrating
      ctx.beginPath();
      ctx.arc(speakerX + coneDisp - 5, speakerY, 12, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      ctx.restore();

      // 4. Oscilloscope (Draw the wave form at the bottom)
      const oscY = 280;
      const oscHeight = 60;
      ctx.save();
      ctx.strokeStyle = '#10b981'; // Green wave
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#10b981';

      // Draw oscilloscope screen background
      ctx.fillStyle = 'rgba(5, 7, 11, 0.8)';
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(40, oscY - oscHeight - 10, w - 80, oscHeight * 2 + 20, 6);
      ctx.fill();
      ctx.stroke();

      // Draw zero axis line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(50, oscY);
      ctx.lineTo(w - 50, oscY);
      ctx.stroke();

      // Draw wave graph
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      const oscStartX = 60;
      const oscEndX = w - 60;
      
      for (let x = oscStartX; x <= oscEndX; x++) {
        const progress = (x - oscStartX) / (oscEndX - oscStartX);
        // Wave frequency scaling
        const waveScale = (freq / 440) * 0.08;
        const wavePhase = (x * waveScale) - (time * 0.7);
        
        let waveVal = 0;
        const oscAmp = (amp / 10) * oscHeight;

        // Custom wave types
        if (Math.round(waveType) === 0) {
          // Sine
          waveVal = Math.sin(wavePhase);
        } else if (Math.round(waveType) === 1) {
          // Square
          waveVal = Math.sign(Math.sin(wavePhase));
        } else {
          // Triangle
          waveVal = (2 / Math.PI) * Math.asin(Math.sin(wavePhase));
        }

        const y = oscY - waveVal * oscAmp;
        if (x === oscStartX) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();

      // 5. Annotate Vectors (showing compression wave velocity)
      if (isVectorVisible) {
        // Velocity arrow pointing to the right showing sound propagation direction
        drawArrow(ctx, speakerX + 20, speakerY, speakerX + 80, speakerY, '#3b82f6', 3, 10);
        ctx.fillStyle = '#3b82f6';
        ctx.font = '12px var(--font-sans)';
        ctx.fillText('声速 v (≈340m/s)', speakerX + 20, speakerY - 20);
      }

      // Draw current status texts on screen
      const types = ['正弦波 (Sine)', '方波 (Square)', '三角波 (Triangle)'];
      drawLabel(ctx, `频率: ${freq.toFixed(0)} Hz`, 20, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `振幅: ${amp.toFixed(1)} (音量)`, 130, 20, '12px var(--font-sans)', 'var(--text-primary)');
      drawLabel(ctx, `波形: ${types[Math.round(waveType)]}`, 240, 20, '12px var(--font-sans)', 'var(--text-primary)');

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isGridVisible, isVectorVisible, simSpeed, freq, amp, waveType]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="simulation-canvas"
      />
      {/* Audio Play/Mute controls overlaid inside visualizer */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <button
          onClick={toggleAudio}
          className={`btn ${isAudioOn ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
        >
          {isAudioOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {isAudioOn ? "关闭音效" : "开启音效"}
        </button>
      </div>
    </div>
  );
};
