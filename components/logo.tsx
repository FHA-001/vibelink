export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="140"
      height="40"
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* VL - Bold and prominent */}
      <text
        x="5"
        y="32"
        fontFamily="Sora, sans-serif"
        fontSize="32"
        fontWeight="800"
        fill="#C9A227"
      >
        VL
      </text>
      
      {/* VibeLink Text - smaller and lighter */}
      <text
        x="45"
        y="32"
        fontFamily="Sora, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="#334155"
      >
        Vibe
      </text>
      <text
        x="87"
        y="32"
        fontFamily="Sora, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="#C9A227"
      >
        Link
      </text>
    </svg>
  );
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="8" fill="#C9A227" />
      <circle cx="35" cy="12" r="5" fill="#2CB5A5" />
      <circle cx="35" cy="28" r="5" fill="#2CB5A5" />
      <line x1="26" y1="16" x2="31" y2="13" stroke="#C9A227" strokeWidth="2" />
      <line x1="26" y1="24" x2="31" y2="27" stroke="#C9A227" strokeWidth="2" />
    </svg>
  );
}