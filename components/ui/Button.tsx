import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_STYLES: Record<Variant, { background: string; color: string; border: string }> = {
  primary: {
    background: "var(--color-primary-bg)",
    color: "var(--color-primary-fg)",
    border: "1px solid var(--color-primary-bg)",
  },
  secondary: {
    background: "var(--color-bg)",
    color: "var(--color-fg)",
    border: "1px solid var(--color-secondary-border)",
  },
  danger: {
    background: "var(--color-bg)",
    color: "var(--color-danger)",
    border: "1px solid var(--color-danger)",
  },
};

export function Button({
  variant = "primary",
  style,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const variantStyle = VARIANT_STYLES[variant];
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...variantStyle,
        padding: "8px 14px",
        borderRadius: 6,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    />
  );
}
