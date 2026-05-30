import { forwardRef, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, className = "", ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        ref={ref}
        className={`h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});
