import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary-600 via-primary-500 to-accent-emerald text-white shadow-neon-sm hover:shadow-neon-md",
  secondary:
    "bg-gradient-to-r from-accent-emerald to-primary-500 text-white shadow-lg hover:shadow-xl",
  outline:
    "bg-white/80 backdrop-blur-sm border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-600",
  ghost:
    "bg-transparent text-primary-600 hover:bg-primary-50",
  danger:
    "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  icon,
  iconPosition = "right",
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "relative overflow-hidden font-bold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2";

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  const content = (
    <>
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === "left" && <span>{icon}</span>}
      <span className="relative z-10">{children}</span>
      {!loading && icon && iconPosition === "right" && <span>{icon}</span>}
      {variant === "primary" && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/30 to-accent-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${classes} group`}>
        {content}
      </Link>
    );
  }

  return (
    <button className={`${classes} group`} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
