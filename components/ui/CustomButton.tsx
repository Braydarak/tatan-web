"use client";

import * as React from "react";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export type CustomButtonVariant = "filled" | "outline" | "ghost" | "text";

export type CustomButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  type?: CustomButtonVariant;
  htmlType?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    { type = "filled", htmlType = "button", className, disabled, ...props },
    ref,
  ) => {
    const base =
      "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCD1B1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEFDF8] disabled:cursor-not-allowed disabled:opacity-60";

    const padding = type === "text" ? "px-0 py-0" : "px-4 py-2";

    const variants: Record<CustomButtonVariant, string> = {
      filled:
        "border border-transparent bg-[#FCD1B1] text-zinc-900 shadow-sm hover:bg-[#FCD1B1]/90",
      outline:
        "border border-[#FCD1B1] bg-transparent text-zinc-900 shadow-sm hover:bg-[#FCD1B1]/25",
      ghost:
        "border border-transparent bg-transparent text-zinc-900 hover:bg-[#FCD1B1]/25",
      text: "border w-fit border-transparent bg-transparent text-zinc-900 hover:underline underline-offset-4",
    };

    return (
      <button
        ref={ref}
        type={htmlType}
        disabled={disabled}
        className={cx(base, padding, variants[type], className)}
        {...props}
      />
    );
  },
);

CustomButton.displayName = "CustomButton";

export default CustomButton;
