// Fixed rain streak positions so the illustration renders the same every time.
const RAIN_FAR = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 47) % 680 - 20,
  y: (i * 29) % 340 - 20,
  length: 8 + ((i * 5) % 8),
}))
const RAIN_NEAR = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 71) % 680 - 20,
  y: (i * 43) % 320 - 10,
  length: 20 + ((i * 7) % 14),
}))

const LAMPS = [110, 320, 530]

// Lit windows in the distant skyline: [x, y].
const WINDOWS = [
  [64, 150], [72, 162], [64, 174], [100, 158], [492, 142], [500, 154], [560, 128], [568, 140], [560, 164], [604, 160],
]

/**
 * Locally drawn flood scene (a stone bridge over a swollen river on a rainy day) used in the
 * homepage hero. It is an illustration, not a photograph, and depicts no real place.
 */
export default function FloodIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-flood-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f4d61" />
          <stop offset="0.45" stopColor="#6d7e93" />
          <stop offset="0.6" stopColor="#a7b3c0" />
        </linearGradient>
        <linearGradient id="hero-flood-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d7c63" />
          <stop offset="0.35" stopColor="#6b5f4d" />
          <stop offset="1" stopColor="#363b38" />
        </linearGradient>
        <linearGradient id="hero-flood-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d2dc" stopOpacity="0" />
          <stop offset="1" stopColor="#c9d2dc" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="hero-flood-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b3b7bc" />
          <stop offset="1" stopColor="#8d939a" />
        </linearGradient>
        <linearGradient id="hero-flood-car" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c85a52" />
          <stop offset="1" stopColor="#8f302d" />
        </linearGradient>
        <radialGradient id="hero-flood-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe7a8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffe7a8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-flood-vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#0f172a" stopOpacity="0" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.45" />
        </radialGradient>
        <filter id="hero-flood-blur-lg" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="hero-flood-blur-sm" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Overcast sky with a pale break of light near the horizon */}
      <rect width="640" height="360" fill="url(#hero-flood-sky)" />
      <ellipse cx="400" cy="150" rx="240" ry="36" fill="#dfe5ea" opacity="0.55" filter="url(#hero-flood-blur-lg)" />
      <g filter="url(#hero-flood-blur-lg)">
        <g fill="#334156" opacity="0.75">
          <ellipse cx="80" cy="40" rx="150" ry="38" />
          <ellipse cx="320" cy="22" rx="190" ry="34" />
          <ellipse cx="580" cy="46" rx="160" ry="40" />
        </g>
        <g fill="#5a6a7f" opacity="0.6">
          <ellipse cx="190" cy="92" rx="140" ry="18" />
          <ellipse cx="500" cy="100" rx="150" ry="16" />
        </g>
      </g>

      {/* Distant skyline, two depths, fading into the haze */}
      <g fill="#8a99ab" opacity="0.7">
        <rect x="0" y="146" width="30" height="56" />
        <rect x="130" y="160" width="44" height="42" />
        <rect x="430" y="150" width="36" height="52" />
        <rect x="610" y="136" width="30" height="66" />
      </g>
      <g fill="#64758a">
        <rect x="36" y="134" width="26" height="68" />
        <rect x="58" y="142" width="22" height="60" />
        <rect x="92" y="150" width="30" height="52" />
        <rect x="484" y="132" width="28" height="70" />
        <rect x="552" y="118" width="24" height="84" />
        <rect x="578" y="148" width="40" height="54" />
      </g>
      <g fill="#f1d28a" opacity="0.55">
        {WINDOWS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="5" />
        ))}
      </g>
      <rect y="110" width="640" height="96" fill="url(#hero-flood-haze)" />

      {/* Trees on the far bank */}
      <g fill="#34493f">
        <circle cx="160" cy="186" r="20" />
        <circle cx="186" cy="192" r="14" />
        <circle cx="440" cy="188" r="18" />
        <circle cx="462" cy="194" r="12" />
      </g>

      {/* Lamp glow behind the bridge railing */}
      {LAMPS.map((x) => (
        <circle key={`glow-${x}`} cx={x} cy="114" r="26" fill="url(#hero-flood-lamp)" />
      ))}

      {/* Bridge */}
      <g>
        {LAMPS.map((x) => (
          <g key={`lamp-${x}`} fill="#2c3540">
            <rect x={x - 1.5} y="112" width="3" height="40" />
            <rect x={x - 6} y="108" width="12" height="5" rx="1.5" />
            <rect x={x - 3} y="113" width="6" height="3" fill="#ffe7a8" />
          </g>
        ))}
        <g stroke="#d9dcdf" strokeWidth="2">
          <line x1="0" y1="140" x2="640" y2="140" />
          {Array.from({ length: 41 }, (_, i) => (
            <line key={i} x1={i * 16} y1="140" x2={i * 16} y2="152" />
          ))}
        </g>
        <rect x="0" y="152" width="640" height="10" fill="#c7cace" />
        <rect x="0" y="162" width="640" height="4" fill="#80868d" />
        <rect x="0" y="166" width="640" height="36" fill="url(#hero-flood-stone)" />
        <g stroke="#7d838a" strokeWidth="1" opacity="0.35">
          <line x1="0" y1="176" x2="640" y2="176" />
          <line x1="0" y1="188" x2="640" y2="188" />
        </g>
        {/* Arch openings, nearly filled by the risen water */}
        <g fill="#3c454d">
          <path d="M30 202 A75 30 0 0 1 180 202 Z" />
          <path d="M220 202 A100 32 0 0 1 420 202 Z" />
          <path d="M460 202 A75 30 0 0 1 610 202 Z" />
        </g>
      </g>

      {/* Floodwater */}
      <path d="M0 198 Q80 192 160 198 T320 198 T480 198 T640 198 V360 H0 Z" fill="url(#hero-flood-water)" />

      {/* Blurred reflections of the bridge and lamps */}
      <g filter="url(#hero-flood-blur-sm)">
        <rect x="0" y="202" width="640" height="18" fill="#b3b7bc" opacity="0.16" />
        {LAMPS.map((x) => (
          <rect key={`reflect-${x}`} x={x - 3} y="204" width="6" height="64" fill="#ffe7a8" opacity="0.3" />
        ))}
      </g>

      {/* Foam where the current hits the piers */}
      <g fill="#ece6d8" opacity="0.5">
        <ellipse cx="200" cy="203" rx="30" ry="4" />
        <ellipse cx="440" cy="203" rx="30" ry="4" />
      </g>

      {/* Surface current */}
      <g fill="none" stroke="#ece6d8" strokeLinecap="round">
        <g strokeWidth="1.5" opacity="0.28">
          <path d="M20 222 q30 -6 60 0 t60 0" />
          <path d="M240 218 q30 -6 60 0 t60 0 t60 0" />
          <path d="M510 226 q30 -6 60 0 t60 0" />
          <path d="M150 240 q24 -5 48 0" />
          <path d="M420 244 q24 -5 48 0" />
        </g>
        <g strokeWidth="2.2" opacity="0.22">
          <path d="M210 268 q40 -9 80 0 t80 0" />
          <path d="M440 288 q40 -9 80 0 t80 0" />
          <path d="M0 312 q50 -11 100 0 t100 0 t100 0" />
          <path d="M360 334 q50 -11 100 0 t100 0 t100 0" />
        </g>
      </g>

      {/* Half-submerged car */}
      <g>
        <path d="M58 270 q4 -26 30 -30 h62 q24 4 30 30 z" fill="url(#hero-flood-car)" />
        <path d="M92 246 h50 q12 2 18 18 h-80 q4 -14 12 -18 z" fill="#2f3d48" />
        <path d="M94 250 h20 v12 h-28 q2 -8 8 -12 z" fill="#a9bfcf" opacity="0.7" />
        <path d="M120 250 h20 q10 2 14 12 h-34 z" fill="#a9bfcf" opacity="0.55" />
        <path d="M94 250 l10 0 l-10 12 z" fill="#e6eef4" opacity="0.5" />
        <path d="M46 270 q70 -10 146 0" fill="none" stroke="#ece6d8" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
        <path d="M60 280 q56 -6 112 0" fill="none" stroke="#ece6d8" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      </g>

      {/* Street sign leaning in the current */}
      <g transform="rotate(-9 520 270)">
        <rect x="518" y="236" width="4" height="50" fill="#26303a" />
        <rect x="503" y="218" width="34" height="34" rx="3" transform="rotate(45 520 235)" fill="#e2b33c" />
        <rect x="503" y="218" width="34" height="34" rx="3" transform="rotate(45 520 235)" fill="none" stroke="#26303a" strokeWidth="2" />
        <path d="M512 243 l8 -14 l8 14 z" fill="#26303a" />
      </g>
      <path d="M498 286 q22 -6 44 0" fill="none" stroke="#ece6d8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {/* Floating debris */}
      <g fill="#5b4632">
        <rect x="300" y="300" width="58" height="6" rx="2" transform="rotate(-6 329 303)" />
        <rect x="604" y="318" width="40" height="5" rx="2" transform="rotate(8 624 320)" />
      </g>

      {/* Rain, far and near */}
      <g stroke="#e9eef4" strokeLinecap="round">
        <g strokeWidth="1" opacity="0.28">
          {RAIN_FAR.map((drop, i) => (
            <line key={i} x1={drop.x} y1={drop.y} x2={drop.x - drop.length * 0.3} y2={drop.y + drop.length} />
          ))}
        </g>
        <g strokeWidth="1.6" opacity="0.38">
          {RAIN_NEAR.map((drop, i) => (
            <line key={i} x1={drop.x} y1={drop.y} x2={drop.x - drop.length * 0.3} y2={drop.y + drop.length} />
          ))}
        </g>
      </g>

      <rect width="640" height="360" fill="url(#hero-flood-vignette)" />
    </svg>
  )
}
