import type { ReactNode } from "react";

/** The bordered, rounded, scrollable wrapper every data table in the app
 * sits in. */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={"overflow-x-auto rounded-lg border border-zinc-200 bg-white" + (className ? " " + className : "")}>
      {children}
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={"w-full text-sm" + (className ? " " + className : "")}>{children}</table>;
}

/** Standard header row — uppercase, muted, zinc-50 background. */
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  className,
  align = "left",
  sticky = false,
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right";
  sticky?: boolean;
}) {
  return (
    <th
      className={
        "px-4 py-3 whitespace-nowrap " +
        (align === "right" ? "text-right " : "text-left ") +
        (sticky ? "sticky left-0 z-20 bg-zinc-50 " : "") +
        (className ?? "")
      }
    >
      {children}
    </th>
  );
}

/** Standard body row. */
export function Tr({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr className={"border-b border-zinc-100 last:border-0" + (className ? " " + className : "")} onClick={onClick}>
      {children}
    </tr>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={"px-4 py-3" + (className ? " " + className : "")}>{children}</td>;
}

/** The "nothing here yet" row every table shows for its empty state. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-zinc-500">
        {children}
      </td>
    </tr>
  );
}
