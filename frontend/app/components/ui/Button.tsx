import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "secondary", children, className = "", ...props }: PropsWithChildren<ButtonProps>) {
  const variantClass =
    variant === "primary"
      ? "border border-sky-700/10 bg-gradient-to-r from-[#1F5F8B] to-[#2FA4C8] text-white shadow-[0_10px_24px_rgba(31,95,139,0.22)] hover:shadow-[0_14px_28px_rgba(47,164,200,0.26)]"
      : variant === "danger"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
        : "border border-[#1F5F8B]/20 bg-white text-[#1F5F8B] hover:border-[#2FA4C8]/45 hover:bg-[#E6F4F9] dark:border-white/10 dark:bg-[#102132] dark:text-[#9DDAEE] dark:hover:border-[#2FA4C8]/25 dark:hover:bg-[#16314A]";
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}
