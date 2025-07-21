export function DoDDOSSeal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      {...props}
    >
      <circle cx="100" cy="100" r="98" fill="#fff" stroke="#000" strokeWidth="2" />
      <circle cx="100" cy="100" r="70" fill="#000080" />
      <g fill="#fff">
        <path d="M100 30 L105 50 L125 50 L110 65 L115 85 L100 75 L85 85 L90 65 L75 50 L95 50 Z" />
        <path d="m100 45 a55 55 0 1 0 0.001 0" fill="none" stroke="#fff" strokeWidth="1" />
      </g>
      <text
        x="100"
        y="25"
        fontFamily="serif"
        fontSize="14"
        textAnchor="middle"
        fill="#000"
        fontWeight="bold"
      >
        DEPARTMENT OF DEFENSE
      </text>
      <text
        x="100"
        y="185"
        fontFamily="serif"
        fontSize="14"
        textAnchor="middle"
        fill="#000"
        fontWeight="bold"
      >
        UNITED STATES OF AMERICA
      </text>
      <g transform="translate(100,100)">
        <path d="M0-65L61.8-20L38.2,52.6h-76.4L-61.8-20z" fill="#fff" />
        <path d="M0-52l49.4-16L30.6,42H-30.6L-49.4-16z" fill="#000080" />
        <g id="e" transform="translate(0,-30)">
          <path id="b" d="M0-12l11.4 8.3L7-10H-7L-11.4-1.7z" fill="#fff" />
          <use xlinkHref="#b" transform="scale(-1)" />
        </g>
        <use xlinkHref="#e" transform="rotate(72)" />
        <use xlinkHref="#e" transform="rotate(144)" />
        <use xlinkHref="#e" transform="rotate(216)" />
        <use xlinkHref="#e" transform="rotate(288)" />
      </g>
      <path
        d="M 100,100 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0"
        fill="none"
        stroke="#ffd700"
        strokeWidth="3"
      />
      <circle cx="100" cy="100" r="35" fill="#fff" />
      <image href="https://placehold.co/60x60.png" x="70" y="70" height="60" width="60" data-ai-hint="eagle emblem" />
    </svg>
  );
}
