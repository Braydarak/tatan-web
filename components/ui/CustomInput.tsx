"use client";

import * as React from "react";
import EyeAnimation from "@/components/animations/EyeAnimation";

export type CustomInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "children"
> & {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
};

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" />
      <path d="M21 21l-5.2-5.2" />
    </svg>
  );
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
      error,
      className,
      containerClassName,
      inputClassName,
      id,
      type,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const errorId = error ? `${inputId}-error` : undefined;
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;
    const isSearch = resolvedType === "search";

    return (
      <div className={cx("w-full min-w-0", containerClassName, className)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-semibold tracking-tight text-[#FCD1B1]"
          >
            {label}
          </label>
        ) : null}

        <div className="relative w-full min-w-0">
          {isSearch ? (
            <span className="pointer-events-none border-[#FCD1B1] absolute inset-y-0 left-3 flex items-center text-zinc-500">
              <IconSearch className="h-5 w-5" />
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={errorId}
            className={cx(
              "block w-full min-w-0 rounded-lg border-2 bg-white px-4 py-3 text-base text-black shadow-sm placeholder:text-zinc-400",
              "transition-colors duration-150",
              "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none",
              "border-[#FCD1B1]",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isSearch && "pl-10",
              isPassword && "pr-12",
              error && "border-red-500",
              inputClassName,
            )}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              disabled={props.disabled}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => setShowPassword((v) => !v)}
              className={cx(
                "absolute inset-y-0 right-0 flex items-center justify-center px-3",
                "text-zinc-500 transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error && "text-red-500",
              )}
            >
              <EyeAnimation open={showPassword} />
            </button>
          ) : null}
        </div>

        {error ? (
          <p
            id={errorId}
            aria-live="polite"
            className="mt-1 text-sm font-medium text-red-600"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

CustomInput.displayName = "CustomInput";

export default CustomInput;
