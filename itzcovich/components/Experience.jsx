'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { scroll } from '@/lib/scroll';

const World = dynamic(() => import('./three/World'), { ssr: false });

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/** Fixed 3D layer behind the page, with a static fallback when WebGL is unavailable. */
export default function Experience() {
  const [mode, setMode] = useState('pending');
  useEffect(() => {
    scroll.mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    setMode(webglOK() ? '3d' : 'fallback');
  }, []);
  if (mode === '3d') return <div className="world"><World /></div>;
  return (
    <div className="world-fallback" aria-hidden="true">
      <svg viewBox="0 0 600 260" fill="none" stroke="#2b2925" strokeWidth="1"><path d="M20 230h560M80 230V120h260v110M200 120V60h220v60M420 120v110M100 140h220v70H100zM220 76h180v36H220z" /><path d="M60 245h300M360 230v15" /></svg>
    </div>
  );
}
