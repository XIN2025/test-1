'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1000, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const previousValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const previousValue = previousValueRef.current;

    if (previousValue !== value) {
      setIsAnimating(true);
      setShowParticles(true);

      // Cancel any ongoing animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const startTime = Date.now();
      const difference = value - previousValue;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easeOutCubic for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);

        const currentValue = previousValue + difference * easedProgress;
        setDisplayValue(Math.round(currentValue));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
          setIsAnimating(false);
          previousValueRef.current = value;

          // Hide particles after animation
          setTimeout(() => setShowParticles(false), 500);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }
  }, [value, duration]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div className='relative inline-block'>
      {/* Particle effects */}
      {showParticles && (
        <div className='pointer-events-none absolute inset-0'>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className='absolute h-1 w-1 animate-ping rounded-full bg-yellow-400'
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '1000ms',
              }}
            />
          ))}
        </div>
      )}

      {/* Main counter with enhanced animations */}
      <span
        className={`relative inline-block font-bold transition-all duration-300 ease-out ${
          isAnimating ? 'scale-125 animate-pulse text-yellow-400 drop-shadow-lg' : 'scale-100 text-current'
        } ${className} `}
        style={{
          textShadow: isAnimating ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none',
        }}
      >
        {displayValue}

        {/* Glow effect during animation */}
        {isAnimating && (
          <div
            className='absolute inset-0 -z-10 rounded bg-gradient-to-r from-yellow-400/20 to-orange-400/20 blur-sm'
            style={{
              animation: 'glow 1s ease-in-out infinite alternate',
            }}
          />
        )}
      </span>

      <style jsx>{`
        @keyframes glow {
          from {
            opacity: 0.5;
            transform: scale(1);
          }
          to {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedCounter;
