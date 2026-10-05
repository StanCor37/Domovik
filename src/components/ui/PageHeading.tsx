import type { ReactNode } from "react";

/** Plain page title — every settings/calendar screen. No hero band: those
 * stay reserved for Dashboard/Ledger/Login, see PageHeader below. */
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={action ? "flex items-center justify-between" : undefined}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Branded navy/coral grain header band — reserved for top-level "brand
 * moment" screens (Dashboard, Ledger, Login), per the design system. */
export function PageHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={"hero-band" + (className ? " " + className : "")}>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-200">{subtitle}</p>}
    </div>
  );
}
