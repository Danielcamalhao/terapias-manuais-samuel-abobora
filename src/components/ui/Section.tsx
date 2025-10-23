import React from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: "white" | "gray" | "gradient" | "transparent";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
  decorative?: boolean;
}

const backgroundClasses: Record<NonNullable<SectionProps["background"]>, string> = {
  white: "bg-white",
  gray: "bg-gray-50",
  gradient: "bg-gradient-to-br from-gray-50 via-primary-50/20 to-gray-100",
  transparent: "bg-transparent",
};

const paddingClasses: Record<NonNullable<SectionProps["padding"]>, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-16",
  lg: "py-24",
  xl: "py-32",
};

const maxWidthClasses: Record<NonNullable<SectionProps["maxWidth"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  "4xl": "max-w-[90rem]",
  "6xl": "max-w-[100rem]",
  "7xl": "max-w-[120rem]",
  full: "max-w-full",
};

export default function Section({
  children,
  className = "",
  background = "transparent",
  padding = "lg",
  maxWidth = "7xl",
  decorative = false,
}: SectionProps) {
  return (
    <section
      className={`relative ${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}
    >
      {decorative && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-accent-emerald/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-20 left-20 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          />
        </div>
      )}

      <div className={`relative z-10 ${maxWidthClasses[maxWidth]} mx-auto px-6`}>
        {children}
      </div>
    </section>
  );
}

// Componentes especializados
export function SectionHeader({
  badge,
  title,
  description,
  className = "",
}: {
  badge?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center mb-16 animate-fade-in ${className}`}>
      {badge && (
        <div className="inline-block mb-4">
          <span className="text-sm font-semibold tracking-wider text-primary-600 uppercase bg-primary-100 px-4 py-2 rounded-full">
            {badge}
          </span>
        </div>
      )}
      <h2 className="text-4xl md:text-6xl font-display font-extrabold mb-6">
        {title}
      </h2>
      {description && (
        <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
