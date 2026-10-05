import type { ReactNode } from "react";

/** The bordered, rounded, scrollable wrapper every data table in the app
 * sits in: white, warm hairline, 13px corners, no shadow. */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={"overflow-x-auto rounded-lg border-[1.5px] border-zinc-200 bg-white" + (className ? " " + className : "")}>
      {children}
    </div>
  );
}

/** Refs, dates and amounts line up: tabular figures. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <table className={"w-full text-[15px] leading-5 font-mono" + (className ? " " + className : "")}>{children}</table>
  );
}

/** Header row: Arial uppercase labels (as the MASTER's RowTable labels) in
 * mute on the warm fill. */
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="table-head-grain text-label border-b-[1.5px] border-zinc-200 text-left text-zinc-500">
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
        "px-3 py-2.5 font-normal whitespace-nowrap " +
        (align === "right" ? "text-right " : "text-left ") +
        (sticky ? "table-head-grain sticky left-0 z-20 " : "") +
        (className ?? "")
      }
    >
      {children}
    </th>
  );
}

/** Body row: warm hairline divider, warm fill on hover. */
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
    <tr
      className={"border-b border-zinc-200 last:border-0 hover:bg-zinc-50" + (className ? " " + className : "")}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/** Body cell: 40px rows. */
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={"h-10 px-3 py-2" + (className ? " " + className : "")}>{children}</td>;
}

/** The "nothing here yet" row every table shows for its empty state. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center font-sans text-zinc-500">
        {children}
      </td>
    </tr>
  );
}
