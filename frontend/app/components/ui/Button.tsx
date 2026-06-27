import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "secondary", children, className = "", ...props }: PropsWithChildren<ButtonProps>) {
  const variantClass =
    variant === "primary"
      ? "border border-[#1F5F8B] bg-[#1F5F8B] text-white hover:border-[#174B70] hover:bg-[#174B70]"
      : variant === "danger"
        ? "border border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-400/25 dark:bg-[#0F1F2F] dark:text-rose-200 dark:hover:bg-rose-500/10"
        : "border border-[#C9D8E2] bg-white text-[#1F5F8B] hover:border-[#1F5F8B] hover:bg-[#F6FAFC] dark:border-white/10 dark:bg-[#0F1F2F] dark:text-[#A8D8EA] dark:hover:border-[#2FA4C8]/40 dark:hover:bg-[#13283A]";
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 max-w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold leading-tight transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}
