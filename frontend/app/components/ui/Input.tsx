import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-[#516C7E] dark:text-slate-400">
      {label}
      <input
        {...props}
        className={`min-h-11 w-full rounded-lg border border-[#C9D8E2] bg-white px-3 py-2.5 text-sm text-[#17324A] outline-none transition placeholder:text-[#8BA2B5] focus:border-[#1F5F8B] focus:ring-2 focus:ring-[#1F5F8B]/10 dark:border-white/10 dark:bg-[#0F1F2F] dark:text-[#E2EDF5] dark:placeholder:text-slate-500 dark:focus:border-[#2FA4C8] ${className}`}
      />
    </label>
  );
}
