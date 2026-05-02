import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold tracking-[0.16em] text-[#648197] dark:text-slate-400">
      {label}
      <input
        {...props}
        className={`rounded-xl border border-[#1F5F8B]/14 bg-white px-4 py-3 text-sm text-[#17324A] outline-none ring-0 transition placeholder:text-[#8BA2B5] focus:border-[#2FA4C8] focus:bg-[#F9FDFE] dark:border-white/10 dark:bg-[#102132] dark:text-[#E2EDF5] dark:placeholder:text-slate-500 dark:focus:bg-[#132A3D] ${className}`}
      />
    </label>
  );
}
