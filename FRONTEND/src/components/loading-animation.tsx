
'use client';

import React, { useEffect, useRef } from 'react';
import './ui/loading-animation.css';

export function LoadingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
    };
    
    resizeCanvas();

    const indicLetters = "अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहಟಠಡಢಣಅಆಇಈಉಊಎಐಒಓకఖగఘఙచఛజఝఞതഥദധനകഖഗഘങਚਛਜਝਞতথদধনবভম";
    const binary = "01";
    const characters = (indicLetters + binary).split('');
    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    let drops: number[] = [];

    const initializeDrops = () => {
        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.floor(Math.random() * (canvas.height / fontSize));
        }
    };
    
    initializeDrops();

    let backgroundEnabled = false;
    const backgroundTimeout = setTimeout(() => { backgroundEnabled = true; }, 2000);

    let animationFrameId: number;
    let lastTime = 0;
    const fps = 30; // Target FPS
    const interval = 1000 / fps;

    function draw(timestamp: number) {
      if (!ctx) return;
      const deltaTime = timestamp - lastTime;
      
      if (deltaTime > interval) {
        lastTime = timestamp - (deltaTime % interval);

        if (backgroundEnabled) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = characters[Math.floor(Math.random() * characters.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const gradient = ctx.createLinearGradient(x, y - fontSize * 20, x, y);
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,1)');

          ctx.fillStyle = gradient;
          ctx.fillText(text, x, y);

          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    }

    animationFrameId = requestAnimationFrame(draw);
    
    const handleResize = () => {
        resizeCanvas();
        initializeDrops();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(backgroundTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="indic-matrix-loader-container">
      <canvas ref={canvasRef} id="matrix"></canvas>
      <div className="loading">LOADING<span className="dots"></span></div>
    </div>
  );
}
