import type { Ref } from "react";

export type EyeSvgProps = {
  open: boolean;
  className?: string;
  slashClipPathId?: string;
  slashRectRef?: Ref<SVGRectElement>;
};

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function EyeSvg({
  open,
  className,
  slashClipPathId,
  slashRectRef,
}: EyeSvgProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cx("block", className)}
    >
      {slashClipPathId ? (
        <defs>
          <clipPath id={slashClipPathId}>
            <rect
              ref={slashRectRef}
              x="0"
              y="0"
              width="24"
              height={open ? 0 : 24}
            />
          </clipPath>
        </defs>
      ) : null}

      <g
        className={cx(
          "origin-center transition-transform duration-200 ease-out",
          open ? "scale-100" : "scale-95",
        )}
      >
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cx(
            "origin-center transition-[opacity,transform] duration-200 ease-out",
            open ? "opacity-100 scale-100" : "opacity-40 scale-90",
          )}
        />
      </g>

      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath={slashClipPathId ? `url(#${slashClipPathId})` : undefined}
      />
    </svg>
  );
}
