import type { ReactNode } from "react";

export type CardTone = "info" | "success" | "warning" | "danger";

export const CARD_TONE_CLASSES: Record<CardTone, string> = {
  info: "bg-info-wash border-info-border",
  success: "bg-success-wash border-success-border",
  warning: "bg-warning-wash border-warning-border",
  danger: "bg-danger-wash border-danger-border",
};

export const TONE_TEXT_CLASSES: Record<CardTone, string> = {
  info: "text-primary",
  success: "text-success",
  warning: "text-warning-ink",
  danger: "text-danger-ink",
};

/** Base bordered surface — optionally tinted with a semantic tone wash. */
export function Card({
  tone,
  className,
  children,
}: {
  tone?: CardTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (tone ? CARD_TONE_CLASSES[tone] : "border-zinc-200 bg-white") +
        (className ? " " + className : "")
      }
    >
      {children}
    </div>
  );
}

/** The white bordered box every settings form (and the reservation list/
 * table wrapper) sits in, with an optional small heading. */
export function FormCard({
  title,
  maxWidth,
  className,
  children,
  ...rest
}: {
  title?: string;
  maxWidth?: string;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<"form">, "className" | "children">) {
  return (
    <form
      className={
        "flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 " +
        (maxWidth ?? "") +
        (className ? " " + className : "")
      }
      {...rest}
    >
      {title && <h2 className="font-medium">{title}</h2>}
      {children}
    </form>
  );
}
