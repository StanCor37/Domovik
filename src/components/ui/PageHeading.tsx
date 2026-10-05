import type { ReactNode } from "react";

/** Page title: a headline in Carlito, regular weight, tight leading —
 * settings and calendar screens. */
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
    <div className={action ? "flex flex-wrap items-end justify-between gap-3" : undefined}>
      <div>
        <h1 className="title-page">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-5 text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Header band: the MASTER's blue gradient panel with white text —
 * Dashboard, Ledger and Login. */
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
      <h1 className="text-[30px] leading-none font-normal text-white">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] leading-5 text-[#e3ecf4]">{subtitle}</p>}
    </div>
  );
}
