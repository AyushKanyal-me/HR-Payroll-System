import React from 'react';

interface DoodleProps {
  className?: string;
  size?: number | string;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}

const GOLD_COLOR = '#d4af37'; // Classic polished metallic gold
const GOLD_LIGHT = '#fbdf7e'; // Bright highlight gold
const GOLD_DARK = '#9a7b20';  // Deep antique gold

/**
 * 1. Plain Half Pine Tree (No ornaments, clean outline, second half completely empty)
 */
export const DoodleHalfTree: React.FC<DoodleProps> = ({
  size = 180,
  color = GOLD_COLOR,
  opacity = 0.75,
  style = {},
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="goldTreeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD_COLOR} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      {/* Central Axis Blueprint Guide */}
      <line x1="100" y1="15" x2="100" y2="225" stroke={color} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8" />

      {/* Left-Half Pine Tree (Pure plain fir branches, crisp golden outlines, NO ornaments) */}
      {/* Outer Silhouette */}
      <path
        d="M100 28 L80 60 L92 60 L70 90 L85 90 L58 125 L76 125 L45 165 L68 165 L35 205 L100 205"
        stroke="url(#goldTreeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Internal Architectural Hatching / Needles Texture (Left half only) */}
      <path
        d="M100 42 L84 56 M100 52 L91 58 M100 70 L76 86 M100 80 L84 88 M100 102 L66 122 M100 114 L78 123 M100 138 L54 160 M100 152 L70 163 M100 175 L45 200 M100 190 L62 203"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Trunk (Left half only) */}
      <path
        d="M100 205 L88 205 L86 230 L100 230"
        stroke="url(#goldTreeGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="93" y1="207" x2="92" y2="228" stroke={color} strokeWidth="1.2" opacity="0.75" />

      {/* Architectural ground baseline */}
      <line x1="25" y1="230" x2="100" y2="230" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="45" y1="234" x2="95" y2="234" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
};

/**
 * 2. Unfinished Gears (Interlocking mechanical gears with golden drafting marks)
 */
export const DoodleGears: React.FC<DoodleProps> = ({
  size = 200,
  color = GOLD_COLOR,
  opacity = 0.75,
  style = {},
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="goldGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="70%" stopColor={GOLD_COLOR} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      {/* Blueprint Construction Lines */}
      <line x1="15" y1="100" x2="225" y2="100" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      <line x1="80" y1="15" x2="80" y2="185" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      <line x1="160" y1="25" x2="160" y2="175" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

      {/* Left Large Gear */}
      <g transform="translate(80, 100)">
        <circle cx="0" cy="0" r="46" stroke="url(#goldGearGrad)" strokeWidth="2.2" />
        <circle cx="0" cy="0" r="34" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
        <circle cx="0" cy="0" r="16" stroke="url(#goldGearGrad)" strokeWidth="1.8" />
        <circle cx="0" cy="0" r="6" fill={color} opacity="0.6" />

        {/* 12 Teeth for Main Gear */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <path
            key={deg}
            d="M-6 -46 L-5 -55 L5 -55 L6 -46 Z"
            transform={`rotate(${deg})`}
            stroke="url(#goldGearGrad)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        ))}

        {/* Hatching / Spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-16"
            x2="0"
            y2="-34"
            transform={`rotate(${deg})`}
            stroke={color}
            strokeWidth="1.5"
            opacity="0.85"
          />
        ))}
      </g>

      {/* Right Secondary Interlocking Gear */}
      <g transform="translate(155, 75)">
        <circle cx="0" cy="0" r="32" stroke="url(#goldGearGrad)" strokeWidth="2" />
        <circle cx="0" cy="0" r="22" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
        <circle cx="0" cy="0" r="10" stroke="url(#goldGearGrad)" strokeWidth="1.6" />

        {/* 8 Teeth for Secondary Gear */}
        {[15, 60, 105, 150, 195, 240, 285, 330].map((deg) => (
          <path
            key={deg}
            d="M-5 -32 L-4 -39 L4 -39 L5 -32 Z"
            transform={`rotate(${deg})`}
            stroke="url(#goldGearGrad)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Top Minor Unfinished Drafting Gear */}
      <g transform="translate(180, 135)">
        <circle cx="0" cy="0" r="24" stroke={color} strokeWidth="1.4" strokeDasharray="3 3" opacity="0.85" />
        <circle cx="0" cy="0" r="8" stroke={color} strokeWidth="1.4" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke={color} strokeWidth="1" opacity="0.65" />
        <line x1="0" y1="-30" x2="0" y2="30" stroke={color} strokeWidth="1" opacity="0.65" />
        {[0, 45, 90, 135].map((deg) => (
          <circle key={deg} cx="0" cy="-24" r="2" transform={`rotate(${deg})`} fill={color} opacity="0.8" />
        ))}
      </g>
    </svg>
  );
};

/**
 * 3. Partial Clock (Roman numeral luxury clock with golden outlines)
 */
export const DoodleClock: React.FC<DoodleProps> = ({
  size = 200,
  color = GOLD_COLOR,
  opacity = 0.75,
  style = {},
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="goldClockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD_COLOR} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      {/* Outer Dual Rings */}
      <circle cx="110" cy="110" r="96" stroke="url(#goldClockGrad)" strokeWidth="2.2" />
      <circle cx="110" cy="110" r="90" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <circle cx="110" cy="110" r="74" stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.65" />

      {/* Blueprint Crosshairs */}
      <line x1="110" y1="4" x2="110" y2="216" stroke={color} strokeWidth="0.9" strokeDasharray="4 4" opacity="0.5" />
      <line x1="4" y1="110" x2="216" y2="110" stroke={color} strokeWidth="0.9" strokeDasharray="4 4" opacity="0.5" />

      {/* Roman Numerals in Golden Accent */}
      <g
        fontFamily="serif"
        fontSize="12.5"
        fontWeight="700"
        fill={color}
        textAnchor="middle"
        dominantBaseline="central"
        opacity="0.95"
      >
        <text x="110" y="28">XII</text>
        <text x="151" y="39">I</text>
        <text x="181" y="69">II</text>
        <text x="192" y="110">III</text>
        <text x="181" y="151">IV</text>
        <text x="151" y="181">V</text>
        <text x="110" y="192">VI</text>
        <text x="69" y="181">VII</text>
        <text x="39" y="151">VIII</text>
        <text x="28" y="110">IX</text>
        <text x="39" y="69">X</text>
        <text x="69" y="39">XI</text>
      </g>

      {/* Minute Tick Marks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const isHour = i % 5 === 0;
        return (
          <line
            key={i}
            x1="110"
            y1={isHour ? '17' : '20'}
            x2="110"
            y2="24"
            transform={`rotate(${i * 6} 110 110)`}
            stroke={color}
            strokeWidth={isHour ? '2' : '1'}
            opacity={isHour ? '0.95' : '0.6'}
          />
        );
      })}

      {/* Ornate Golden Clock Hands */}
      <g transform="translate(110, 110)">
        {/* Hour Hand (pointing ~ 10:10) */}
        <path
          d="M0 0 L-2.5 -10 L-4.5 -38 L0 -50 L4.5 -38 L2.5 -10 Z"
          transform="rotate(-55)"
          stroke="url(#goldClockGrad)"
          strokeWidth="1.6"
          fill="rgba(212, 175, 55, 0.15)"
        />
        {/* Minute Hand */}
        <path
          d="M0 0 L-2.5 -12 L-3.5 -58 L0 -74 L3.5 -58 L2.5 -12 Z"
          transform="rotate(62)"
          stroke="url(#goldClockGrad)"
          strokeWidth="1.6"
          fill="rgba(212, 175, 55, 0.15)"
        />
        {/* Center Pivot */}
        <circle cx="0" cy="0" r="6" stroke="url(#goldClockGrad)" strokeWidth="2" />
        <circle cx="0" cy="0" r="3" fill={color} />
      </g>
    </svg>
  );
};

/**
 * 4. Schematic Handshake (Architectural hatched handshake with golden outlines)
 */
export const DoodleHandshake: React.FC<DoodleProps> = ({
  size = 220,
  color = GOLD_COLOR,
  opacity = 0.75,
  style = {},
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="goldHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD_COLOR} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      {/* Left Arm & Cuff */}
      <path
        d="M20 70 L60 62 L75 78 L52 108 L20 95"
        stroke="url(#goldHandGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="60" y1="62" x2="52" y2="108" stroke={color} strokeWidth="1.8" />
      <line x1="63" y1="64" x2="55" y2="106" stroke={color} strokeWidth="1.2" opacity="0.7" />

      {/* Left Hand Clasp */}
      <path
        d="M75 78 L105 72 L125 88 L120 96 L108 96 L98 106 L85 106 L74 96"
        stroke="url(#goldHandGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Right Arm & Cuff */}
      <path
        d="M220 70 L180 62 L165 78 L188 108 L220 95"
        stroke="url(#goldHandGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="180" y1="62" x2="188" y2="108" stroke={color} strokeWidth="1.8" />
      <line x1="177" y1="64" x2="185" y2="106" stroke={color} strokeWidth="1.2" opacity="0.7" />

      {/* Right Hand Clasp Fingers */}
      <path
        d="M165 78 L135 72 L115 88 L120 96 L132 96 L142 106 L155 106 L166 96"
        stroke="url(#goldHandGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Interlocking Grip Center Details */}
      <path
        d="M105 82 C115 84 125 84 135 82 M108 90 C118 92 122 92 132 90 M112 98 C118 100 122 100 128 98"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Schematic Crosshatch Shading */}
      <path
        d="M32 75 L45 88 M40 73 L53 86 M195 73 L208 86 M187 75 L200 88 M80 82 L90 92 M150 82 L160 92"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.75"
      />

      {/* Motion / Blueprint Axis */}
      <line x1="10" y1="120" x2="230" y2="120" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
    </svg>
  );
};

/**
 * 5. Balance Scale (Refined architectural balance scale with golden outlines)
 */
export const DoodleScale: React.FC<DoodleProps> = ({
  size = 200,
  color = GOLD_COLOR,
  opacity = 0.75,
  style = {},
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="goldScaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD_COLOR} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      {/* Central Pillar & Fulcrum */}
      <line x1="110" y1="36" x2="110" y2="185" stroke="url(#goldScaleGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="106" y1="42" x2="106" y2="185" stroke={color} strokeWidth="1" opacity="0.7" />
      <line x1="114" y1="42" x2="114" y2="185" stroke={color} strokeWidth="1" opacity="0.7" />

      {/* Pillar Top Finial */}
      <circle cx="110" cy="30" r="7" stroke="url(#goldScaleGrad)" strokeWidth="2" />
      <circle cx="110" cy="30" r="3" fill={color} />

      {/* Pedestal Base */}
      <path
        d="M85 195 L95 185 L125 185 L135 195 Z"
        stroke="url(#goldScaleGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="80" y="195" width="60" height="7" rx="2" stroke="url(#goldScaleGrad)" strokeWidth="1.6" fill="rgba(212, 175, 55, 0.15)" />

      {/* Cross Beam */}
      <path
        d="M38 52 C70 47 150 47 182 52"
        stroke="url(#goldScaleGrad)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="38" cy="52" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="182" cy="52" r="4" stroke={color} strokeWidth="1.5" />

      {/* Left Pan Strings & Dish */}
      <line x1="38" y1="56" x2="18" y2="120" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <line x1="38" y1="56" x2="58" y2="120" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <line x1="38" y1="56" x2="38" y2="120" stroke={color} strokeWidth="0.9" strokeDasharray="3 3" opacity="0.6" />
      <path
        d="M14 120 C14 136 62 136 62 120 Z"
        stroke="url(#goldScaleGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(212, 175, 55, 0.1)"
      />

      {/* Left Metric Weights */}
      <rect x="25" y="106" width="10" height="14" rx="1" stroke={color} strokeWidth="1.4" />
      <rect x="40" y="100" width="12" height="20" rx="1" stroke={color} strokeWidth="1.4" />
      <circle cx="30" cy="103" r="2.5" stroke={color} strokeWidth="1.2" />
      <circle cx="46" cy="97" r="2.5" stroke={color} strokeWidth="1.2" />

      {/* Right Pan Strings & Dish */}
      <line x1="182" y1="56" x2="162" y2="120" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <line x1="182" y1="56" x2="202" y2="120" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <line x1="182" y1="56" x2="182" y2="120" stroke={color} strokeWidth="0.9" strokeDasharray="3 3" opacity="0.6" />
      <path
        d="M158 120 C158 136 206 136 206 120 Z"
        stroke="url(#goldScaleGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="rgba(212, 175, 55, 0.1)"
      />

      {/* Right Single Solid Weight */}
      <path
        d="M176 96 L188 96 L192 120 L172 120 Z"
        stroke="url(#goldScaleGrad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="182" cy="92" r="3.5" stroke={color} strokeWidth="1.4" />
    </svg>
  );
};

/**
 * 6. Compass (Navigational schematic compass rose with golden star and coordinate ticks)
 */
export const DoodleCompass: React.FC<DoodleProps> = ({
  size = 200,
  color = GOLD_COLOR,
  opacity = 0.75,
  style = {},
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity, pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.25))', ...style }}
    >
      <defs>
        <linearGradient id="goldCompGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD_COLOR} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>

      {/* Outer Coordinate Circles */}
      <circle cx="110" cy="110" r="92" stroke="url(#goldCompGrad)" strokeWidth="1.8" />
      <circle cx="110" cy="110" r="82" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <circle cx="110" cy="110" r="48" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Coordinate Radians / Degree Ticks */}
      {Array.from({ length: 36 }).map((_, i) => (
        <line
          key={i}
          x1="110"
          y1="20"
          x2="110"
          y2={i % 9 === 0 ? '28' : '24'}
          transform={`rotate(${i * 10} 110 110)`}
          stroke={color}
          strokeWidth={i % 9 === 0 ? '2' : '1'}
          opacity={i % 9 === 0 ? '0.95' : '0.6'}
        />
      ))}

      {/* Cardinal Labels */}
      <g
        fontFamily="sans-serif"
        fontSize="13.5"
        fontWeight="800"
        fill={color}
        textAnchor="middle"
        dominantBaseline="central"
        opacity="0.95"
      >
        <text x="110" y="9">N</text>
        <text x="211" y="110">E</text>
        <text x="110" y="211">S</text>
        <text x="9" y="110">W</text>
      </g>

      {/* Compass Star Points */}
      {/* North Point */}
      <polygon points="110,28 116,96 110,110" fill="url(#goldCompGrad)" opacity="0.45" stroke="url(#goldCompGrad)" strokeWidth="1.5" />
      <polygon points="110,28 104,96 110,110" fill="none" stroke="url(#goldCompGrad)" strokeWidth="1.5" />

      {/* South Point */}
      <polygon points="110,192 104,124 110,110" fill="url(#goldCompGrad)" opacity="0.45" stroke="url(#goldCompGrad)" strokeWidth="1.5" />
      <polygon points="110,192 116,124 110,110" fill="none" stroke="url(#goldCompGrad)" strokeWidth="1.5" />

      {/* East Point */}
      <polygon points="192,110 124,116 110,110" fill="url(#goldCompGrad)" opacity="0.45" stroke="url(#goldCompGrad)" strokeWidth="1.5" />
      <polygon points="192,110 124,104 110,110" fill="none" stroke="url(#goldCompGrad)" strokeWidth="1.5" />

      {/* West Point */}
      <polygon points="28,110 96,104 110,110" fill="url(#goldCompGrad)" opacity="0.45" stroke="url(#goldCompGrad)" strokeWidth="1.5" />
      <polygon points="28,110 96,116 110,110" fill="none" stroke="url(#goldCompGrad)" strokeWidth="1.5" />

      {/* Diagonal Secondary Minor Points */}
      <polygon points="168,52 118,102 110,110" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <polygon points="52,52 102,102 110,110" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <polygon points="168,168 118,118 110,110" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <polygon points="52,168 102,118 110,110" stroke={color} strokeWidth="1.2" opacity="0.8" />

      {/* Center Pivot Ring */}
      <circle cx="110" cy="110" r="8" stroke="url(#goldCompGrad)" strokeWidth="2" />
      <circle cx="110" cy="110" r="4" fill={color} />
    </svg>
  );
};
