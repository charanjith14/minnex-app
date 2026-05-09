import { useId } from "react";

const BRAND = {
  customer: {
    word: "MINNEX",
    accent: "",
    tagline: "India's Smart Delivery Network",
    label: "Minnex customer app logo"
  },
  agent: {
    word: "MINNEX",
    accent: "GO",
    tagline: "Deliver Faster. Earn More.",
    label: "Minnex Go delivery partner app logo"
  },
  admin: {
    word: "MINNEX",
    accent: "BIZ",
    tagline: "Your Restaurant. Your Growth.",
    label: "Minnex Biz merchant dashboard logo"
  }
};

function CustomerMark({ id }) {
  return (
    <svg className="minnex-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff5a1f" />
          <stop offset="0.55" stopColor="#ff8c00" />
          <stop offset="1" stopColor="#ffb800" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="20" y1="10" x2="100" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`}>
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="26" fill={`url(#${id}-bg)`} />
      <rect x="6" y="6" width="108" height="54" rx="26" fill={`url(#${id}-shine)`} />
      {/* Abstract M lightning bolt */}
      <path
        className="logo-customer-pin"
        d="M32 82 L48 38 L60 62 L72 38 L88 82"
        stroke="white"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${id}-glow)`}
      />
      {/* Location pin dot */}
      <circle cx="60" cy="96" r="6" fill="white" opacity="0.9" />
      <circle cx="60" cy="96" r="2.5" fill="#ff5a1f" />
    </svg>
  );
}

function AgentMark({ id }) {
  return (
    <svg className="minnex-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="120" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="0.5" stopColor="#10b981" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="20" y1="10" x2="100" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="26" fill={`url(#${id}-bg)`} />
      <rect x="6" y="6" width="108" height="54" rx="26" fill={`url(#${id}-shine)`} />
      {/* Speed lines */}
      <path className="logo-speed-line logo-speed-line-one" d="M18 48 L48 48" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.6" />
      <path className="logo-speed-line logo-speed-line-two" d="M14 62 L50 62" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
      <path className="logo-speed-line logo-speed-line-three" d="M20 76 L50 76" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.5" />
      {/* Scooter / GO arrow */}
      <path
        className="logo-agent-m"
        d="M52 78 L80 40 L94 60 L80 60 L96 82"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function AdminMark({ id }) {
  return (
    <svg className="minnex-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="120" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4c1d95" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="20" y1="10" x2="100" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="26" fill={`url(#${id}-bg)`} />
      <rect x="6" y="6" width="108" height="54" rx="26" fill={`url(#${id}-shine)`} />
      {/* Chart bars for merchant */}
      <rect x="28" y="72" width="16" height="24" rx="4" fill="white" opacity="0.5" />
      <rect x="52" y="54" width="16" height="42" rx="4" fill="white" opacity="0.8" />
      <rect x="76" y="38" width="16" height="58" rx="4" fill="white" />
      {/* Trend line */}
      <path className="logo-utensil" d="M28 68 L60 46 L84 32" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <circle cx="84" cy="32" r="5" fill="white" />
    </svg>
  );
}

export default function MinnexLogo({
  variant = "customer",
  className = "",
  wordmark = false,
  tagline = false
}) {
  const safeVariant = BRAND[variant] ? variant : "customer";
  const brand = BRAND[safeVariant];
  const id = `minnex-${safeVariant}-${useId().replace(/:/g, "")}`;
  const Mark = safeVariant === "agent" ? AgentMark : safeVariant === "admin" ? AdminMark : CustomerMark;

  return (
    <span
      className={`minnex-logo minnex-logo-${safeVariant} ${wordmark ? "minnex-logo-lockup" : "minnex-logo-icon"} ${className}`.trim()}
      role="img"
      aria-label={brand.label}
    >
      <Mark id={id} />
      {wordmark && (
        <span className="minnex-logo-copy">
          <span className="minnex-logo-word">
            {brand.word}
            {brand.accent && <span className="minnex-logo-highlight"> {brand.accent}</span>}
          </span>
          {tagline && <span className="minnex-logo-tagline">{brand.tagline}</span>}
        </span>
      )}
    </span>
  );
}