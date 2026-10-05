import { initialsOf } from "@/lib/initials";

const SIZES = {
  sm: "h-8 w-8 text-[13px]",
  lg: "h-14 w-14 text-[20px]",
} as const;

/** The person's initials in a blue circle (header menu, Profile). */
export function Avatar({ name, size = "sm" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden="true"
      className={
        "inline-grid shrink-0 place-items-center rounded-full bg-primary leading-none font-bold text-on-primary select-none " +
        SIZES[size]
      }
    >
      {initialsOf(name)}
    </span>
  );
}
