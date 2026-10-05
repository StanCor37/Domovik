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
  success: "text-success-ink",
  warning: "text-warning-ink",
  danger: "text-danger-ink",
};

/** Base surface (MASTER warm card): warm fill, 1.5px warm hairline, 13px
 * corners, no shadow — optionally tinted with a status wash. */
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
        "rounded-lg border-[1.5px] p-5 " +
        (tone ? CARD_TONE_CLASSES[tone] : "border-zinc-200 bg-card") +
        (className ? " " + className : "")
      }
    >
      {children}
    </div>
  );
}

/** The warm card every settings form sits in, with an optional card title
 * (Carlito 18px bold). */
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
        "flex flex-col gap-4 rounded-lg border-[1.5px] border-zinc-200 bg-card p-5 " +
        (maxWidth ?? "") +
        (className ? " " + className : "")
      }
      {...rest}
    >
      {title && <h2 className="title-section">{title}</h2>}
      {children}
    </form>
  );
}
