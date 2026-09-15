/**
 * Decorative hero vector background — connection, compatibility, shared direction.
 * Pure SVG/CSS; pointer-events none; hidden from assistive tech.
 */
export function HeroVectorBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Soft glowing orbs — slow float */}
      <div className="cupid-hero-float-a absolute -right-10 top-8 h-[420px] w-[420px] rounded-full bg-[#F1ECFF]/90 blur-2xl md:h-[520px] md:w-[520px]" />
      <div className="cupid-hero-float-b absolute -bottom-16 -right-20 h-[280px] w-[340px] rounded-full bg-[#FFF0EE]/95 blur-2xl" />
      <div className="cupid-hero-glow absolute -left-20 top-24 h-56 w-56 rounded-full bg-[#F1ECFF]/70 blur-3xl" />
      <div className="absolute right-[18%] top-[12%] hidden h-28 w-28 rounded-full bg-[#DDF8EA]/55 blur-2xl lg:block" />

      {/* Bottom wave transition */}
      <svg
        className="absolute bottom-0 left-0 h-16 w-full text-[#FAFAF8] sm:h-20"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M0 48 C180 72 360 16 540 36 C720 56 900 80 1080 52 C1260 24 1350 40 1440 32 L1440 80 L0 80 Z"
          opacity="0.95"
        />
        <path
          fill="#FFFFFF"
          d="M0 56 C220 78 440 28 680 48 C920 68 1160 76 1440 44 L1440 80 L0 80 Z"
          opacity="0.55"
        />
      </svg>

      {/* Mobile / simplified layer */}
      <svg
        className="absolute inset-0 h-full w-full md:hidden"
        viewBox="0 0 390 760"
        fill="none"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
      >
        <ellipse cx="310" cy="280" rx="140" ry="160" fill="#F1ECFF" opacity="0.55" />
        <path
          id="cupid-hero-m-violet"
          className="cupid-hero-draw"
          d="M40 520 C120 420, 200 460, 260 380 C300 330, 320 280, 340 220"
          stroke="url(#cupid-hero-grad-m-v)"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
          fill="none"
        />
        <path
          id="cupid-hero-m-coral"
          d="M60 560 C150 480, 230 500, 290 420 C330 370, 350 310, 355 250"
          stroke="#FF6B6B"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.28"
          fill="none"
        />
        <circle className="cupid-hero-pulse" cx="260" cy="380" r="3.5" fill="#8B5CF6" opacity="0.7" />
        <circle className="cupid-hero-pulse-delay" cx="340" cy="220" r="3" fill="#FF6B6B" opacity="0.65" />
        <circle cx="290" cy="420" r="2.5" fill="#6D28D9" opacity="0.5" />
        <defs>
          <linearGradient id="cupid-hero-grad-m-v" x1="40" y1="520" x2="340" y2="220">
            <stop stopColor="#6D28D9" stopOpacity="0.15" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tablet + desktop composition */}
      <svg
        className="absolute inset-0 hidden h-full w-full md:block"
        viewBox="0 0 1440 900"
        fill="none"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="cupid-hero-grad-violet" x1="720" y1="120" x2="1320" y2="640">
            <stop stopColor="#6D28D9" stopOpacity="0.1" />
            <stop offset="0.45" stopColor="#8B5CF6" stopOpacity="0.75" />
            <stop offset="1" stopColor="#6D28D9" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="cupid-hero-grad-coral" x1="780" y1="180" x2="1280" y2="700">
            <stop stopColor="#FF6B6B" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#FF6B6B" stopOpacity="0.7" />
            <stop offset="1" stopColor="#FF6B6B" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="cupid-hero-grad-join" x1="980" y1="520" x2="1180" y2="720">
            <stop stopColor="#8B5CF6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FF6B6B" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="cupid-hero-ellipse-lav" cx="50%" cy="50%" r="50%">
            <stop stopColor="#F1ECFF" stopOpacity="0.95" />
            <stop offset="1" stopColor="#F1ECFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cupid-hero-ellipse-coral" cx="50%" cy="50%" r="50%">
            <stop stopColor="#FFF0EE" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFF0EE" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Large background shapes framing product cards */}
        <ellipse cx="1080" cy="340" rx="260" ry="300" fill="url(#cupid-hero-ellipse-lav)" opacity="0.85" />
        <ellipse cx="1340" cy="720" rx="220" ry="160" fill="url(#cupid-hero-ellipse-coral)" opacity="0.8" />
        <ellipse cx="1280" cy="120" rx="160" ry="110" fill="#F1ECFF" opacity="0.45" />
        <circle cx="1045" cy="168" r="18" fill="#DDF8EA" opacity="0.7" className="hidden lg:block" />

        {/* Abstract connection symbols — geometric, modern */}
        <g className="hidden lg:block" opacity="0.35">
          {/* Two circles connected */}
          <circle cx="860" cy="140" r="10" stroke="#8B5CF6" strokeWidth="1.2" fill="none" />
          <circle cx="900" cy="140" r="10" stroke="#FF6B6B" strokeWidth="1.2" fill="none" />
          <path d="M870 140 C880 128, 880 152, 890 140" stroke="#8B5CF6" strokeWidth="1.1" fill="none" />
          {/* Overlapping rounded forms → abstract heart */}
          <path
            d="M1220 560 C1220 540, 1240 528, 1256 544 C1272 528, 1292 540, 1292 560 C1292 590, 1256 612, 1256 612 C1256 612, 1220 590, 1220 560 Z"
            stroke="#8B5CF6"
            strokeWidth="1.1"
            fill="none"
            opacity="0.8"
          />
          {/* Broken circle becoming complete */}
          <path
            d="M1320 300 A22 22 0 1 1 1338 330"
            stroke="#6D28D9"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M1342 334 A22 22 0 0 1 1320 300"
            stroke="#FF6B6B"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="3 5"
            fill="none"
          />
          {/* Parallel lines joining */}
          <path d="M780 620 L860 620" stroke="#C4B5FD" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M780 632 L860 632" stroke="#F9A8D4" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M860 620 C880 620, 880 632, 900 626" stroke="#8B5CF6" strokeWidth="1.2" fill="none" />
          {/* Paired nodes */}
          <circle cx="940" cy="700" r="3" fill="#6D28D9" />
          <circle cx="958" cy="700" r="3" fill="#FF6B6B" />
          <path d="M943 700 H955" stroke="#A78BFA" strokeWidth="1" />
        </g>

        {/* Large partial heart outline behind profile card */}
        <path
          className="hidden lg:block"
          d="M1020 280 C1020 220, 1100 190, 1160 250 C1220 190, 1300 220, 1300 280 C1300 380, 1160 460, 1160 460 C1160 460, 1020 380, 1020 280 Z"
          stroke="#8B5CF6"
          strokeWidth="1.4"
          fill="none"
          opacity="0.14"
        />

        {/* Left-side restrained detail — outside text column */}
        <g opacity="0.4">
          <path
            d="M-20 200 C40 160, 70 240, 110 210"
            stroke="#C4B5FD"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          <circle className="cupid-hero-pulse" cx="48" cy="188" r="3" fill="#8B5CF6" />
          <circle cx="92" cy="218" r="2.2" fill="#A78BFA" />
          <circle cx="28" cy="240" r="2" fill="#C4B5FD" />
          <path
            d="M20 520 C80 490, 120 560, 160 540"
            stroke="#DDD6FE"
            strokeWidth="1"
            strokeDasharray="3 7"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          {/* Tiny sparkles */}
          <path d="M70 300 L72 306 L78 308 L72 310 L70 316 L68 310 L62 308 L68 306 Z" fill="#8B5CF6" opacity="0.45" />
          <path d="M110 580 L111.5 584 L115.5 585.5 L111.5 587 L110 591 L108.5 587 L104.5 585.5 L108.5 584 Z" fill="#FF6B6B" opacity="0.4" />
        </g>

        {/* Compatibility constellation — desktop only, around product preview */}
        <g className="hidden lg:block" opacity="0.55">
          {/* Values — heart outline */}
          <g transform="translate(980,110)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <path
              d="M0 5 C0 5 -6 0 -6 -3 C-6 -6 -3 -7 0 -4 C3 -7 6 -6 6 -3 C6 0 0 5 0 5 Z"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="1.1"
            />
          </g>
          {/* Personality — spark */}
          <g transform="translate(1280,200)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#8B5CF6" />
          </g>
          {/* Lifestyle — leaf */}
          <g transform="translate(1340,360)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <path d="M0 5 C-5 0 -4 -6 0 -7 C4 -6 5 0 0 5 Z" fill="none" stroke="#6D28D9" strokeWidth="1.1" />
            <path d="M0 5 L0 -4" stroke="#6D28D9" strokeWidth="1" />
          </g>
          {/* Communication — message */}
          <g transform="translate(1290,520)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <rect x="-5" y="-3.5" width="10" height="7" rx="1.5" fill="none" stroke="#FF6B6B" strokeWidth="1.1" />
            <path d="M-2 3.5 L0 6 L2 3.5" fill="none" stroke="#FF6B6B" strokeWidth="1.1" />
          </g>
          {/* Family — two people */}
          <g transform="translate(1120,640)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <circle cx="-3" cy="-2" r="2" fill="#6D28D9" />
            <circle cx="3" cy="-2" r="2" fill="#FF6B6B" />
            <path d="M-6 5 C-6 2 -4 1 -3 1 C-1 1 0 2 0 3 C0 2 1 1 3 1 C4 1 6 2 6 5" fill="none" stroke="#8B5CF6" strokeWidth="1.1" />
          </g>
          {/* Future — arrow/star */}
          <g transform="translate(920,600)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <path d="M-4 4 L4 -4 M1 -4 H4 V-1" stroke="#6D28D9" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>
          {/* Culture — globe */}
          <g transform="translate(860,420)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <circle cx="0" cy="0" r="5" fill="none" stroke="#8B5CF6" strokeWidth="1.1" />
            <path d="M-5 0 H5 M0 -5 V5 M-4 -2 C-1 0 1 0 4 -2 M-4 2 C-1 0 1 0 4 2" stroke="#8B5CF6" strokeWidth="0.9" fill="none" />
          </g>
          {/* Location — pin */}
          <g transform="translate(900,250)">
            <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#E8E6EE" strokeWidth="1" />
            <path d="M0 -5 C-3 -5 -4 -2 -4 0 C-4 3 0 7 0 7 C0 7 4 3 4 0 C4 -2 3 -5 0 -5 Z" fill="none" stroke="#FF6B6B" strokeWidth="1.1" />
            <circle cx="0" cy="-1" r="1.2" fill="#FF6B6B" />
          </g>

          {/* Thin constellation links */}
          <path d="M980 124 L900 250" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.55" />
          <path d="M900 250 L860 420" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.5" />
          <path d="M860 420 L920 600" stroke="#DDD6FE" strokeWidth="0.8" opacity="0.5" />
          <path d="M920 600 L1120 640" stroke="#FBCFE8" strokeWidth="0.8" opacity="0.5" />
          <path d="M1120 640 L1290 520" stroke="#FBCFE8" strokeWidth="0.8" opacity="0.5" />
          <path d="M1290 520 L1340 360" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.5" />
          <path d="M1340 360 L1280 200" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.5" />
          <path d="M1280 200 L980 124" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.45" />
          {/* Bridge between privacy (top-right of card) and compatibility (bottom-left of card) zones */}
          <path
            d="M1080 220 C1140 300, 1000 420, 980 520"
            stroke="#A78BFA"
            strokeWidth="1"
            strokeDasharray="3 6"
            opacity="0.45"
            fill="none"
          />
        </g>

        {/* Main compatibility ribbons — orbit right product card, converge */}
        <path
          id="cupid-hero-path-violet"
          className="cupid-hero-draw"
          d="M760 100 C820 80, 900 130, 960 190 C1020 250, 1080 200, 1160 240 C1240 280, 1280 360, 1240 450 C1200 540, 1120 580, 1080 640 C1050 680, 1040 720, 1060 760"
          stroke="url(#cupid-hero-grad-violet)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <path
          id="cupid-hero-path-coral"
          className="cupid-hero-draw-delay"
          d="M820 160 C880 200, 940 160, 1000 210 C1060 260, 1120 320, 1180 380 C1240 440, 1260 520, 1200 580 C1140 640, 1100 680, 1080 740"
          stroke="url(#cupid-hero-grad-coral)"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
          opacity="0.65"
        />
        {/* Combined path after convergence */}
        <path
          d="M1060 760 C1100 800, 1160 820, 1240 830"
          stroke="url(#cupid-hero-grad-join)"
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />

        {/* Animated traveling lights */}
        <path
          className="cupid-hero-travel-violet"
          d="M760 100 C820 80, 900 130, 960 190 C1020 250, 1080 200, 1160 240 C1240 280, 1280 360, 1240 450 C1200 540, 1120 580, 1080 640 C1050 680, 1040 720, 1060 760"
          stroke="#8B5CF6"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          className="cupid-hero-travel-coral"
          d="M820 160 C880 200, 940 160, 1000 210 C1060 260, 1120 320, 1180 380 C1240 440, 1260 520, 1200 580 C1140 640, 1100 680, 1080 740"
          stroke="#FF6B6B"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Path nodes — pulse a few key ones */}
        <circle className="cupid-hero-pulse" cx="960" cy="190" r="4.5" fill="#8B5CF6" opacity="0.85" />
        <circle className="cupid-hero-pulse-delay" cx="1160" cy="240" r="4" fill="#6D28D9" opacity="0.8" />
        <circle className="cupid-hero-pulse" cx="1240" cy="450" r="4.5" fill="#FF6B6B" opacity="0.8" />
        <circle className="cupid-hero-pulse-delay" cx="1080" cy="640" r="5" fill="#8B5CF6" opacity="0.85" />
        <circle cx="1000" cy="210" r="3" fill="#FF6B6B" opacity="0.55" />
        <circle cx="1180" cy="380" r="3" fill="#A78BFA" opacity="0.5" />
        <circle cx="1200" cy="580" r="3.2" fill="#FF6B6B" opacity="0.55" />
        <circle cx="1060" cy="760" r="4" fill="#6D28D9" opacity="0.65" />

        {/* Micro-pattern — sparse, uneven, away from left text column */}
        <g opacity="0.055">
          {[
            [700, 80], [740, 140], [800, 70], [880, 90], [1320, 80], [1380, 160],
            [700, 300], [740, 380], [1380, 300], [1400, 420], [720, 500], [760, 560],
            [1380, 560], [700, 680], [780, 720], [1320, 780], [1400, 700], [860, 800],
            [1200, 80], [1100, 760], [980, 820], [1340, 640],
          ].map(([x, y], i) => (
            <g key={`micro-${i}`}>
              {i % 4 === 0 && <circle cx={x} cy={y} r="1.4" fill="#6D28D9" />}
              {i % 4 === 1 && (
                <path d={`M${x} ${y - 3} V${y + 3} M${x - 3} ${y} H${x + 3}`} stroke="#8B5CF6" strokeWidth="1" />
              )}
              {i % 4 === 2 && <circle cx={x} cy={y} r="3" fill="none" stroke="#FF6B6B" strokeWidth="0.9" />}
              {i % 4 === 3 && (
                <path
                  d={`M${x} ${y - 3.5} L${x + 1} ${y - 1} L${x + 3.5} ${y} L${x + 1} ${y + 1} L${x} ${y + 3.5} L${x - 1} ${y + 1} L${x - 3.5} ${y} L${x - 1} ${y - 1} Z`}
                  fill="#8B5CF6"
                />
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
