import React, { useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';

interface Props {
  theme: ThemeConfig;
}

const ParticleBackground: React.FC<Props> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const initParticles = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles = [];

      const count = width < 768 ? 50 : 150; 

      for (let i = 0; i < count; i++) {
        particles.push(createParticle(theme.particleType, width, height));
      }
    };

    const createParticle = (type: string, w: number, h: number) => {
      const base = {
        x: Math.random() * w,
        y: Math.random() * h,
        alpha: Math.random() * 0.5 + 0.2,
      };

      if (type === 'rain') {
        return {
          ...base,
          vy: Math.random() * 15 + 10,
          length: Math.random() * 20 + 10,
          color: 'rgba(174, 194, 224, 0.6)',
        };
      } else if (type === 'fire') {
        return {
          ...base,
          x: w / 2 + (Math.random() * w * 0.8 - w * 0.4), // Center bias
          y: h + Math.random() * 50,
          vy: -(Math.random() * 3 + 1),
          size: Math.random() * 4 + 1,
          color: `rgba(255, ${Math.floor(Math.random() * 100) + 50}, 0, `,
          maxLife: 100,
          life: Math.random() * 100,
        };
      } else if (type === 'fireflies') {
        return {
          ...base,
          vx: Math.random() * 1 - 0.5,
          vy: Math.random() * 1 - 0.5,
          size: Math.random() * 2 + 1,
          color: 'rgba(100, 255, 150, ',
        };
      } else if (type === 'snow') {
        return {
          ...base,
          vx: Math.random() * 1 - 0.5,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 3 + 1,
          color: 'rgba(255, 255, 255, ',
        };
      } else if (type === 'waves') {
         // Waves are drawn differently, not as individual particles usually, 
         // but we will use particles to simulate sparkles on water
         return {
           ...base,
           y: h / 2 + (Math.random() * h/2),
           vx: Math.random() * 2 - 1,
           size: Math.random() * 3,
           color: 'rgba(200, 240, 255, '
         }
      }
      return base;
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      if (theme.particleType === 'waves') {
         // Draw simplified wave sine curves
         ctx.beginPath();
         for (let i = 0; i < width; i+=10) {
            const y = (height / 1.5) + Math.sin(i * 0.01 + Date.now() * 0.001) * 50 + Math.sin(i * 0.03) * 20;
            ctx.lineTo(i, y);
         }
         ctx.lineTo(width, height);
         ctx.lineTo(0, height);
         ctx.fillStyle = 'rgba(0, 100, 200, 0.2)';
         ctx.fill();
         
         // Layer 2
         ctx.beginPath();
         for (let i = 0; i < width; i+=10) {
            const y = (height / 1.4) + Math.sin(i * 0.015 + Date.now() * 0.0015 + 2) * 60;
            ctx.lineTo(i, y);
         }
         ctx.lineTo(width, height);
         ctx.lineTo(0, height);
         ctx.fillStyle = 'rgba(0, 50, 150, 0.2)';
         ctx.fill();
      }

      particles.forEach((p, index) => {
        if (theme.particleType === 'rain') {
          p.y += p.vy;
          if (p.y > height) p.y = -p.length;
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          ctx.stroke();
        } 
        else if (theme.particleType === 'fire') {
          p.y += p.vy;
          p.life--;
          p.x += Math.sin(Date.now() * 0.005 + index) * 0.5;
          if (p.life <= 0) {
             Object.assign(p, createParticle('fire', width, height));
             p.y = height + 10;
          }
          ctx.beginPath();
          const opacity = (p.life / p.maxLife) * 0.8;
          ctx.fillStyle = `${p.color}${opacity})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        else if (theme.particleType === 'fireflies') {
          p.x += p.vx;
          p.y += p.vy;
          // Boundary check
          if(p.x < 0 || p.x > width) p.vx *= -1;
          if(p.y < 0 || p.y > height) p.vy *= -1;

          const pulse = Math.sin(Date.now() * 0.005 + index) * 0.3 + 0.5; // 0.2 to 0.8
          ctx.beginPath();
          ctx.fillStyle = `${p.color}${pulse})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'white';
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        else if (theme.particleType === 'snow') {
          p.x += p.vx + Math.sin(Date.now() * 0.001 + index) * 0.5;
          p.y += p.vy;
          if (p.y > height) p.y = 0;
          if (p.x > width) p.x = 0;
          if (p.x < 0) p.x = width;
          
          ctx.beginPath();
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        else if (theme.particleType === 'waves') {
             // Sparkles on water
             p.y = (height / 1.4) + Math.random() * (height/3);
             ctx.beginPath();
             const sparkle = Math.abs(Math.sin(Date.now() * 0.005 + index));
             ctx.fillStyle = `${p.color}${sparkle})`;
             ctx.arc(p.x, p.y, Math.random() * 2, 0, Math.PI * 2);
             ctx.fill();
        }
      });

      requestRef.current = requestAnimationFrame(update);
    };

    initParticles();
    update();

    const handleResize = () => initParticles();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};

export default ParticleBackground;