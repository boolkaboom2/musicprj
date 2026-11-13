"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useUIStore } from "@/store/uiStore";

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useThemeStore();
  const { isAnimatedBgEnabled } = useUIStore();

  useEffect(() => {
    if (!isAnimatedBgEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let comets: Comet[] = [];
    let ashes: Ash[] = [];
    
    let lastCometTime = 0;
    const isDark = theme === 'dark';

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      ashes = [];
      comets = [];
      
      if (isDark) {
        const count = Math.floor((canvas.width * canvas.height) / 4000);
        for (let i = 0; i < count; i++) {
          stars.push(new Star());
        }
      } else {
        const count = Math.floor((canvas.width * canvas.height) / 6000);
        for (let i = 0; i < count; i++) {
          ashes.push(new Ash());
        }
      }
    };

    class Star {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      alpha: number;
      twinkleSpeed: number;
      time: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.baseAlpha = Math.random() * 0.7 + 0.3;
        this.alpha = this.baseAlpha;
        this.twinkleSpeed = Math.random() * 0.03 + 0.01;
        this.time = Math.random() * 100;
      }

      update() {
        this.time += 1;
        this.alpha = this.baseAlpha + Math.sin(this.time * this.twinkleSpeed) * 0.3;
        this.alpha = Math.max(0.1, Math.min(1, this.alpha));
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx!.fill();

        if (this.size > 1.2) {
          ctx!.beginPath();
          ctx!.moveTo(this.x - this.size * 4, this.y);
          ctx!.lineTo(this.x + this.size * 4, this.y);
          ctx!.moveTo(this.x, this.y - this.size * 4);
          ctx!.lineTo(this.x, this.y + this.size * 4);
          
          ctx!.strokeStyle = `rgba(255, 255, 255, ${this.alpha * 0.4})`;
          ctx!.lineWidth = 0.5;
          ctx!.stroke();
        }
      }
    }

    class Comet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      alpha: number;

      constructor() {
        const fromLeft = Math.random() > 0.5;
        this.x = fromLeft ? Math.random() * (canvas!.width / 2) - 200 : canvas!.width - Math.random() * (canvas!.width / 2) + 200;
        this.y = -Math.random() * 200;
        
        const speed = Math.random() * 4 + 5;
        this.vx = fromLeft ? speed * 0.7 : -speed * 0.7;
        this.vy = speed;
        
        this.length = Math.random() * 150 + 100;
        this.alpha = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
      }

      draw() {
        const tailX = this.x - this.vx * 15;
        const tailY = this.y - this.vy * 15;

        const gradient = ctx!.createLinearGradient(this.x, this.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
        gradient.addColorStop(0.2, `rgba(180, 220, 255, ${this.alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(180, 220, 255, 0)`);

        ctx!.beginPath();
        ctx!.moveTo(this.x, this.y);
        ctx!.lineTo(tailX, tailY);
        ctx!.strokeStyle = gradient;
        ctx!.lineWidth = 2;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, 1)`;
        ctx!.shadowBlur = 10;
        ctx!.shadowColor = "white";
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }

    class Ash {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        
        // Начальная скорость ветра (влево/вправо)
        this.vx = (Math.random() - 0.5) * 0.4; 
        this.vy = Math.random() * 0.1 + 0.05; // Медленное падение
        
        this.size = Math.random() * 2.5 + 1.5;
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        // Случайное блуждание по X (имитация ветра)
        this.vx += (Math.random() - 0.5) * 0.02;
        // Ограничиваем максимальную скорость ветра
        this.vx = Math.max(-0.4, Math.min(0.4, this.vx));

        this.x += this.vx;
        this.y += this.vy;

        if (this.y > canvas!.height + 10) this.y = -10;
        if (this.x < -10) this.x = canvas!.width + 10;
        if (this.x > canvas!.width + 10) this.x = -10;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(50, 50, 50, ${this.alpha})`;
        ctx!.shadowBlur = 4;
        ctx!.shadowColor = "rgba(0,0,0,0.3)";
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isDark) {
        if (Date.now() - lastCometTime > Math.random() * 4000 + 4000) {
           comets.push(new Comet());
           lastCometTime = Date.now();
        }

        stars.forEach(s => {
          s.update();
          s.draw();
        });

        comets.forEach((c, index) => {
          c.update();
          c.draw();
          if (c.x < -300 || c.x > canvas.width + 300 || c.y > canvas.height + 300) {
            comets.splice(index, 1);
          }
        });
      } else {
        ashes.forEach(a => {
          a.update();
          a.draw();
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => init();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isAnimatedBgEnabled]);

  if (!isAnimatedBgEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-500 ${theme === 'dark' ? 'bg-black' : 'bg-[#f8f8f8]'}`}
    />
  );
}