export function LandingHeroVisual() {
  return (
    <svg
      viewBox="0 0 720 900"
      fill="none"
      aria-hidden="true"
      className="h-full w-full text-white"
    >
      <g stroke="currentColor" strokeWidth="1" opacity="0.38">
        <rect x="88" y="72" width="520" height="756" />
        <line x1="148" y1="72" x2="148" y2="828" />
        <line x1="168" y1="148" x2="572" y2="148" />
        <line x1="168" y1="176" x2="420" y2="176" />
      </g>

      <g stroke="currentColor" strokeWidth="1" opacity="0.22">
        {Array.from({ length: 11 }, (_, i) => {
          const y = 228 + i * 28;
          return <line key={y} x1="168" y1={y} x2="572" y2={y} />;
        })}
      </g>

      <g stroke="currentColor" strokeWidth="1" opacity="0.28">
        <rect x="168" y="548" width="404" height="220" />
        {[0, 1, 2, 3, 4].map((col) =>
          [0, 1, 2].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={184 + col * 76}
              y={564 + row * 64}
              width="60"
              height="48"
            />
          )),
        )}
      </g>

      <path
        d="M88 470 C 220 430, 360 510, 608 454"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.45"
      />
      <path
        d="M88 486 C 240 452, 380 528, 608 470"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.22"
      />
    </svg>
  );
}
