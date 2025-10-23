import React from "react";

type CardVariant = "default" | "glass" | "gradient" | "bordered";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "md" | "lg" | "xl" | "2xl" | "3xl";
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white shadow-lg",
  glass: "bg-white/70 backdrop-blur-xl shadow-glass border border-white/50",
  gradient: "bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-100",
  bordered: "bg-white border-2 border-gray-200 shadow-md",
};

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const roundedClasses: Record<NonNullable<CardProps["rounded"]>, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

export default function Card({
  children,
  variant = "default",
  className = "",
  hover = false,
  padding = "md",
  rounded = "2xl",
}: CardProps) {
  const hoverClasses = hover
    ? "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
    : "";

  const classes = `${variantClasses[variant]} ${paddingClasses[padding]} ${roundedClasses[rounded]} ${hoverClasses} ${className}`;

  return <div className={classes}>{children}</div>;
}

// Componentes especializados
export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-2xl font-display font-bold text-primary-700 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-gray-600 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}
