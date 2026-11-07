// Dibujitos decorativos (nubes, estrellas, corazones) con los colores de Tatan.
// Son puramente decorativos: aria-hidden y sin interacción.

type DoodleProps = { className?: string; color?: string };

export function Cloud({ className, color = "#ffffff" }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <path
        d="M16 36h34a12 12 0 0 0 1.6-23.9A16 16 0 0 0 21.3 9 11.5 11.5 0 0 0 16 36Z"
        fill={color}
      />
    </svg>
  );
}

export function StarDoodle({ className, color = "#f7e4a3" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5c.5 0 .9.3 1.1.8l2 4.6 5 .5c1 .1 1.4 1.3.6 2l-3.8 3.3 1.1 4.9c.2 1-.8 1.7-1.7 1.2L12 17.3l-4.3 2.5c-.9.5-1.9-.2-1.7-1.2l1.1-4.9L3.3 10.4c-.8-.7-.4-1.9.6-2l5-.5 2-4.6c.2-.5.6-.8 1.1-.8Z"
        fill={color}
      />
    </svg>
  );
}

export function HeartDoodle({ className, color = "#f4b8c8" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.7 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.3 0 5.4 3.3 4.2 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z"
        fill={color}
      />
    </svg>
  );
}

export function Sparkle({ className, color = "#8dbfa3" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1.5c.6 5.4 3.6 9.3 9.5 10.5-5.9 1.2-8.9 5.1-9.5 10.5C11.4 17.1 8.4 13.2 2.5 12 8.4 10.8 11.4 6.9 12 1.5Z"
        fill={color}
      />
    </svg>
  );
}

/** Subrayado ondulado que se "dibuja" al cargar. */
export function Squiggle({ className, color = "#f6c6a1" }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 220 16"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        className="squiggle-draw"
        d="M3 10c14-8 24-8 36 0s22 8 36 0 24-8 36 0 22 8 36 0 24-8 36 0 22 8 34 0"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  );
}
