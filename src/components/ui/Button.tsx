import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
};

type ButtonAsButton = {
  href?: undefined;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

type ButtonAsLink = {
  href: ComponentProps<typeof Link>["href"];
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "className" | "href" | "children">;

/** The app's one button component — same three variants (primary/secondary/
 * danger) as a `<button>` or, given `href`, a navigating `<Link>`, so every
 * call site stays visually identical without re-typing the variant classes. */
export function Button({ variant = "primary", className, href, ...rest }: ButtonAsButton | ButtonAsLink) {
  const classes = VARIANT_CLASSES[variant] + (className ? " " + className : "");

  if (href !== undefined) {
    return (
      <Link href={href} className={classes} {...(rest as Omit<ButtonAsLink, "href" | "variant" | "className">)} />
    );
  }

  const buttonRest = rest as Omit<ButtonAsButton, "href" | "variant" | "className">;
  return <button type={buttonRest.type ?? "button"} className={classes} {...buttonRest} />;
}
