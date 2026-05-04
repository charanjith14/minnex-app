import { useId } from "react";

const BRAND = {
  customer: {
    word: "MINNEX",
    accent: "",
    tagline: "Food. Fast. Delivered.",
    label: "Minnex customer app logo"
  },
  agent: {
    word: "MINNEX",
    accent: "GO",
    tagline: "Delivering. Every Time.",
    label: "Minnex Go delivery app logo"
  },
  admin: {
    word: "MINNEX",
    accent: "BIZ",
    tagline: "Manage. Grow. Succeed.",
    label: "Minnex Biz merchant app logo"
  }
};

function CustomerMark({ id }) {
  return (
    <svg className="minnex-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-customer`} x1="18" y1="11" x2="101" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb000" />
          <stop offset="0.48" stopColor="#ff6b00" />
          <stop offset="1" stopColor="#ff3d00" />
        </linearGradient>
        <linearGradient id={`${id}-customer-fold`} x1="82" y1="27" x2="98" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffcf54" stopOpacity="0.95" />
          <stop offset="1" stopColor="#c82700" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="24" fill={`url(#${id}-customer)`} />
      <path
        className="logo-customer-fold"
        d="M77 31c5.9-5.8 16-1.6 16 6.7v42.5c0 8.7-10.6 13-16.7 6.8L68 78.5l9-47.5Z"
        fill={`url(#${id}-customer-fold)`}
      />
      <path
        className="logo-customer-ribbon"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28 35.6c0-8.5 10.3-12.8 16.3-6.8L60 44.5l15.7-15.7c6-6 16.3-1.7 16.3 6.8v43.9c0 10-12.2 15.1-19.3 8L60 74.8 47.3 87.5c-7.1 7.1-19.3 2.1-19.3-8V35.6Zm18 24.9v19.2L60 65.6l14 14.1V60.5l-9.2 9.2a6.8 6.8 0 0 1-9.6 0L46 60.5Z"
        fill="white"
      />
      <circle className="logo-customer-pin" cx="60" cy="88" r="12" fill="white" />
      <circle cx="60" cy="88" r="4.5" fill="#ff6b00" opacity="0.92" />
    </svg>
  );
}

function AgentMark({ id }) {
  return (
    <svg className="minnex-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-agent`} x1="17" y1="106" x2="103" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ca65c" />
          <stop offset="0.48" stopColor="#35d64e" />
          <stop offset="1" stopColor="#a6ff00" />
        </linearGradient>
        <linearGradient id={`${id}-agent-m`} x1="35" y1="85" x2="92" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaffd8" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="24" fill={`url(#${id}-agent)`} />
      <path className="logo-speed-line logo-speed-line-one" d="M20 43H51" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <path className="logo-speed-line logo-speed-line-two" d="M14 59H52" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <path className="logo-speed-line logo-speed-line-three" d="M25 75H54" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <path
        className="logo-agent-m"
        d="M43 86.5c-6.5 0-10.5-7-7.2-12.6l22-37.2c2.8-4.7 9.4-5.2 12.9-1L80 46.6l13.7-14.3c5.7-6 15.7-.5 13.6 7.5L94.9 87.1c-2.1 7.9-13.4 7.7-15.1-.3l-4.3-20L66 77.4c-3.2 3.6-8.8 3.6-12.1.1L43 65.8v20.7Z"
        fill={`url(#${id}-agent-m)`}
      />
    </svg>
  );
}

function AdminMark({ id }) {
  return (
    <svg className="minnex-logo-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-admin`} x1="18" y1="104" x2="101" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35118f" />
          <stop offset="0.48" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#c84cff" />
        </linearGradient>
        <linearGradient id={`${id}-admin-home`} x1="37" y1="35" x2="90" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.33" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="24" fill={`url(#${id}-admin)`} />
      <path
        className="logo-admin-home"
        d="M29 55.5c0-4.6 2.2-8.9 5.9-11.7l18.5-13.7a11 11 0 0 1 13.2 0l18.5 13.7A14.6 14.6 0 0 1 91 55.5V91c0 4.4-3.6 8-8 8H69V74.5c0-5-4-9-9-9s-9 4-9 9V99H37c-4.4 0-8-3.6-8-8V55.5Z"
        fill={`url(#${id}-admin-home)`}
      />
      <path
        className="logo-utensil logo-fork"
        d="M42 39c1.3 0 2.3 1 2.3 2.3v19h4.2v-19a2.3 2.3 0 0 1 4.6 0v19h4.2v-19a2.3 2.3 0 0 1 4.6 0v25.4c0 6.4-4.1 11.7-9.8 13.7V97h-8.4V80.4c-5.7-2-9.8-7.3-9.8-13.7V41.3c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3v19h4.2v-19c0-1.3 1-2.3 2.3-2.3Z"
        fill="white"
      />
      <path
        className="logo-utensil logo-spoon"
        d="M79 39c7.8 0 14.1 8.5 14.1 19 0 8.1-3.7 15-9 17.8V97h-9V75.8c-5.3-2.8-9-9.7-9-17.8 0-10.5 5.9-19 12.9-19Z"
        fill="white"
      />
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