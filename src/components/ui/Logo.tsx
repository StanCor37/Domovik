/**
 * The Domovik logo (brand files: public/brand/, "Domovik logo directions").
 *
 * The mark — a "D" with an arched doorway and a Clinic Coral door knob — is
 * drawn inline from the exact path in the brand SVGs. The wordmark is live
 * text in Carlito, as in the brand lockups (which set it as text too), so it
 * matches the app's type and follows the theme.
 *
 * Variants:
 *   default  blue mark + ink wordmark on light; white mark on dark (the
 *            brand's white variant), via the `mark` colour token
 *   onBlue   white mark and wordmark, for the blue gradient panel
 */
export function Logo({
  variant = "default",
  height = 28,
  showWordmark = true,
  className,
}: {
  variant?: "default" | "onBlue";
  /** Height of the mark in px; the wordmark scales with it. */
  height?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  const onBlue = variant === "onBlue";
  return (
    <span
      className={"inline-flex items-center select-none" + (className ? " " + className : "")}
      style={{ gap: height * 0.43 }}
    >
      {/* The brand path spans y 8–56 of a 64 grid; this viewBox crops to it. */}
      <svg
        viewBox="10 8 46 48"
        height={height}
        width={(height * 46) / 48}
        aria-hidden={showWordmark ? true : undefined}
        role={showWordmark ? undefined : "img"}
        aria-label={showWordmark ? undefined : "Domovik"}
        className={onBlue ? "text-paper" : "text-mark"}
      >
        <path
          fillRule="evenodd"
          fill="currentColor"
          d="M10 8 H32 A24 24 0 0 1 32 56 H10 Z M22 56 V38 A7 7 0 0 1 36 38 V56 Z"
        />
        <circle cx="32" cy="47" r="2.6" fill="#E0776F" />
      </svg>
      {showWordmark && (
        <span
          // Lockup proportions (domovik-lockup-primary.svg): 120px type to a
          // 90px mark, a 39px gap, tracking -1.88 at 120px ≈ -0.016em.
          className={"leading-none " + (onBlue ? "text-paper" : "text-zinc-900")}
          style={{ fontSize: height * 1.333, letterSpacing: "-0.016em" }}
        >
          domovik
        </span>
      )}
    </span>
  );
}
