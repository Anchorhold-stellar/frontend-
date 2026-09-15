"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Button, type ButtonVariant } from "./Button";

const ARM_TIMEOUT_MS = 3000;

export function ConfirmButton({
  onConfirm,
  confirmLabel = "Click again to confirm",
  variant = "secondary",
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  onConfirm: () => void;
  confirmLabel?: string;
  variant?: ButtonVariant;
}) {
  const [armed, setArmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function handleClick() {
    if (armed) {
      clearTimeout(timeoutRef.current);
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timeoutRef.current = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS);
  }

  return (
    <Button {...props} variant={armed ? "danger" : variant} onClick={handleClick}>
      {armed ? confirmLabel : children}
    </Button>
  );
}
