/**
 * The signature visual: a dental arch (arcus dentalis) abstracted into a
 * point cloud — nodes on an arc, connected by hairlines, traversed by a
 * single scan line. It is the analyzer's empty-state face.
 *
 * Purely decorative and aria-hidden: the dropzone carries all semantics.
 * No medical imagery — geometry only.
 */

// Nodes distributed along a parabolic arch, mirrored around the centre.
const NODES = [
  { x: 40, y: 148, r: 3.5 },
  { x: 58, y: 108, r: 4 },
  { x: 86, y: 76, r: 4.5 },
  { x: 122, y: 56, r: 5 },
  { x: 160, y: 50, r: 5.5 },
  { x: 198, y: 56, r: 5 },
  { x: 234, y: 76, r: 4.5 },
  { x: 262, y: 108, r: 4 },
  { x: 280, y: 148, r: 3.5 },
];

const ARCH_PATH = "M40 148 Q46 92 86 76 Q122 52 160 50 Q198 52 234 76 Q274 92 280 148";
const INNER_PATH = "M72 150 Q80 108 112 94 Q136 80 160 79 Q184 80 208 94 Q240 108 248 150";

export function ScanArc() {
  // Overflow stays clipped: the scan line travels beyond the viewBox and would
  // otherwise strike through the dropzone text below.
  return (
    <svg
      viewBox="0 0 320 200"
      aria-hidden="true"
      className="h-auto w-full max-w-[320px] overflow-hidden"
      fill="none"
    >
      {/* Measurement grid — faint, gives the instrument a calibrated feel. */}
      <g stroke="currentColor" className="text-scan/10" strokeWidth="1">
        {[0, 1, 2, 3].map((i) => (
          <line key={`h${i}`} x1="16" y1={44 + i * 36} x2="304" y2={44 + i * 36} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={20 + i * 47} y1="30" x2={20 + i * 47} y2="188" />
        ))}
      </g>

      {/* The arch itself. */}
      <path d={ARCH_PATH} stroke="currentColor" className="text-scan/45" strokeWidth="1.5" />
      <path
        d={INNER_PATH}
        stroke="currentColor"
        className="text-scan/20"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* Chords between opposing nodes — the "analysis" reading of the arch. */}
      <g stroke="currentColor" className="text-scan/15" strokeWidth="0.75">
        <line x1="58" y1="108" x2="262" y2="108" />
        <line x1="86" y1="76" x2="234" y2="76" />
        <line x1="122" y1="56" x2="198" y2="56" />
      </g>

      {/* Nodes, pulsing gently out of phase. */}
      <g fill="currentColor" className="text-scan">
        {NODES.map((node, index) => (
          <circle
            key={`${node.x}-${node.y}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            className="arc-node"
            style={{ animationDelay: `${index * 260}ms` }}
            opacity={0.35}
          />
        ))}
      </g>

      {/* Focus reticle on the apex node. */}
      <g stroke="currentColor" className="text-scan/70" strokeWidth="1.25">
        <path d="M144 34 h-10 v10" />
        <path d="M176 34 h10 v10" />
        <path d="M144 68 h-10 v-10" />
        <path d="M176 68 h10 v-10" />
      </g>

      {/* The scan line — one moving element, the whole point of the piece. */}
      <g className="arc-scanline">
        <line
          x1="16"
          y1="30"
          x2="304"
          y2="30"
          stroke="currentColor"
          className="text-scan"
          strokeWidth="1.5"
        />
        <rect x="16" y="30" width="288" height="26" fill="url(#scan-fade)" />
      </g>

      <defs>
        <linearGradient id="scan-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" className="text-scan" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-scan" />
        </linearGradient>
      </defs>
    </svg>
  );
}
