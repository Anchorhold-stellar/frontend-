import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_STYLES: Record<Variant, { background: string; color: string; border: string }> = {
  primary: { background: "#111", color: "#fff", border: "1px solid #111" },
  secondary: { background: "#fff", color: "#111", border: "1px solid #ccc" },
  danger: { background: "#fff", color: "#b00020", border: "1px solid #b00020" },
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
