import { scoreColor } from "@/lib/utils";

/**
 * Circular match-score indicator. The filled arc uses the single accent color
 * for strong matches and neutral gray for weaker ones — no traffic-light colors.
 */
export function MatchScore({
  score,
  size = 52,
}: {
  score: number | null | undefined;
  size?: number;
}) {
  const s = score ?? null;
  const { hex } = scoreColor(s);
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = s == null ? 0 : Math.max(0, Math.min(100, s));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={s == null ? "Not scored yet" : `Match score ${s} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={stroke}
        />
        {s != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={hex}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <span
        className="tnum absolute font-semibold"
        style={{
          color: s == null ? "#A3A3A3" : "#0A0A0A",
          fontSize: size * 0.3,
        }}
      >
        {s == null ? "—" : s}
      </span>
    </div>
  );
}
