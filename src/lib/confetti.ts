/**
 * Lightweight confetti burst from a click event's position.
 * No external dependencies – uses plain DOM + CSS animations.
 */

const COLORS = [
  'hsl(145, 72%, 42%)',  // primary green
  'hsl(195, 95%, 48%)',  // neon-blue
  'hsl(48, 100%, 52%)',  // accent amber
  'hsl(265, 75%, 58%)',  // neon-purple
  'hsl(180, 85%, 48%)',  // neon-cyan
  'hsl(0, 72%, 55%)',    // neon-red
];

export function burstConfetti(e: React.MouseEvent) {
  const count = 30;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = 4 + Math.random() * 6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 40; // slight upward bias
    const rotation = Math.random() * 720 - 360;
    const duration = 600 + Math.random() * 400;

    Object.assign(particle.style, {
      position: 'fixed',
      left: `${originX}px`,
      top: `${originY}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      pointerEvents: 'none',
      zIndex: '99999',
      opacity: '1',
      transform: 'translate(-50%, -50%)',
      transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    });

    if (!document.body) continue;
    document.body.appendChild(particle);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      Object.assign(particle.style, {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation}deg)`,
        opacity: '0',
      });
    });

    setTimeout(() => particle.remove(), duration + 50);
  }
}

/** Full-screen confetti burst from center — used for jackpot alerts */
export function burstConfettiCenter(count = 60) {
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = 5 + Math.random() * 8;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = 120 + Math.random() * 200;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 60;
    const rotation = Math.random() * 720 - 360;
    const duration = 800 + Math.random() * 600;

    Object.assign(particle.style, {
      position: 'fixed',
      left: `${originX}px`,
      top: `${originY}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      pointerEvents: 'none',
      zIndex: '99999',
      opacity: '1',
      transform: 'translate(-50%, -50%)',
      transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    });

    document.body.appendChild(particle);

    requestAnimationFrame(() => {
      Object.assign(particle.style, {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation}deg)`,
        opacity: '0',
      });
    });

    setTimeout(() => particle.remove(), duration + 50);
  }
}
