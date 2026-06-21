"use client";
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FluidShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#030303') }, // Deeper dark background for SaaS
    uColor2: { value: new THREE.Color('#002b36') }, 
    uColor3: { value: new THREE.Color('#081528') }, 
    uColor4: { value: new THREE.Color('#3b0764') }, // Violet shade
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1, 1) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    uniform vec2 uPointer;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 st = gl_FragCoord.xy / uResolution.xy;
      
      float dist = distance(st, uPointer);
      float ripple = sin(dist * 12.0 - uTime * 1.5) * exp(-dist * 4.0);
      
      vec2 pos = st * 2.5;
      float noise1 = snoise(pos + uTime * 0.05);
      float noise2 = snoise(pos + vec2(noise1) + uTime * 0.08);
      
      float f = snoise(pos + vec2(noise2) + ripple * 0.4);
      
      vec3 color = mix(uColor1, uColor2, smoothstep(-1.0, 1.0, f));
      color = mix(color, uColor3, smoothstep(-0.2, 0.8, noise1 * f));
      color = mix(color, uColor4, smoothstep(0.1, 0.9, noise2) * exp(-dist * 1.5));
      
      float vignette = st.x * st.y * (1.0 - st.x) * (1.0 - st.y);
      color *= pow(vignette * 15.0, 0.3);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

const FluidPlane: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#020203') }, 
      uColor2: { value: new THREE.Color('#010f1c') }, 
      uColor3: { value: new THREE.Color('#002633') }, // Dark cyan
      uColor4: { value: new THREE.Color('#38065b') }, // Royal deep purple glow
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uPointer.value.set(
        (state.pointer.x + 1) / 2,
        (state.pointer.y + 1) / 2
      );
      materialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={FluidShaderMaterial.vertexShader}
        fragmentShader={FluidShaderMaterial.fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
};

// New 3D floating particle system overlay
const ParticleOverlay: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 180;
  
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 2] = -0.6 + Math.random() * 0.4; // slight depth separation
      spd[i] = 0.03 + Math.random() * 0.12;
    }
    return [pos, spd];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position;
      const arr = posAttr.array as Float32Array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < count; i++) {
        // Float upwards slowly
        arr[i * 3 + 1] += speeds[i] * 0.004;
        // Subtle horizontal swing
        arr[i * 3] += Math.sin(time * 0.3 + i) * 0.0006;
        
        // Reset if out of bounds
        if (arr[i * 3 + 1] > 1.3) {
          arr[i * 3 + 1] = -1.3;
          arr[i * 3] = (Math.random() - 0.5) * 3.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#00f3ff"
        transparent
        opacity={0.5}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const FluidBackground: React.FC = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ powerPreference: 'high-performance', alpha: false, antialias: false }}
        dpr={[1, 1.5]}
      >
        <FluidPlane />
        <ParticleOverlay />
      </Canvas>
    </div>
  );
};
