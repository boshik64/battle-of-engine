export const VOTE_ANIM_MS = 1200;

export function Tachometer() {
  const start = -120;
  const end = 120;
  const ticks = Array.from({ length: 9 }, (_, i) => start + ((end - start) * i) / 8);
  const labels = [0, 2, 4, 6, 8];

  return (
    <svg className="tach" viewBox="0 0 200 156" role="img" aria-label="Стрелка набирает обороты">
      <circle cx="100" cy="118" r="78" fill="#14110e" stroke="#c4a36a" strokeWidth="3" />
      {ticks.map((deg, i) => {
        const major = i % 2 === 0;
        return (
          <line
            key={deg}
            x1="100"
            y1={118 - 66}
            x2="100"
            y2={118 - (major ? 48 : 54)}
            stroke={i >= 6 ? "#d7b56a" : "#f4efe4"}
            strokeWidth={major ? 2 : 1}
            transform={`rotate(${deg} 100 118)`}
          />
        );
      })}
      {labels.map((n, i) => {
        const deg = start + ((end - start) * i) / 4;
        const rad = ((deg - 90) * Math.PI) / 180;
        const r = 36;
        return (
          <text
            key={n}
            x={100 + r * Math.cos(rad)}
            y={118 + r * Math.sin(rad)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f4efe4"
            fontSize="9"
            fontFamily="inherit"
          >
            {n}
          </text>
        );
      })}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="-120 100 118"
          to="102 100 118"
          dur="1.2s"
          fill="freeze"
        />
        <polygon points="100,46 97,118 103,118" fill="#f4efe4" />
      </g>
      <circle cx="100" cy="118" r="5" fill="#c4a36a" />
      <text
        x="100"
        y="142"
        textAnchor="middle"
        fill="#cbbfae"
        fontSize="8"
        fontFamily="inherit"
      >
        ОБ/МИН
      </text>
    </svg>
  );
}
