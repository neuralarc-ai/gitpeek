import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const theme = {
  colors: {
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
      muted: "hsl(var(--primary-muted))",
      hover: "hsl(var(--primary-hover))",
    },
    background: {
      DEFAULT: "hsl(var(--background))",
      muted: "hsl(var(--background-muted))",
      glass: "hsl(var(--background-glass))",
    },
    card: {
      DEFAULT: "hsl(var(--card))",
      foreground: "hsl(var(--card-foreground))",
      muted: "hsl(var(--card-muted))",
      glass: "hsl(var(--card-glass))",
    },
    border: {
      DEFAULT: "hsl(var(--border))",
      muted: "hsl(var(--border-muted))",
      glass: "hsl(var(--border-glass))",
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))",
      muted: "hsl(var(--accent-muted))",
    },
  },
  glassmorphism: {
    blur: {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl",
    },
    opacity: {
      sm: "bg-opacity-10",
      md: "bg-opacity-20",
      lg: "bg-opacity-30",
      xl: "bg-opacity-40",
    },
    border: {
      sm: "border-white/10",
      md: "border-white/20",
      lg: "border-white/30",
      xl: "border-white/40",
    },
  },
  animation: {
    duration: {
      fast: "duration-200",
      normal: "duration-300",
      slow: "duration-500",
    },
    timing: {
      default: "ease-in-out",
      linear: "linear",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },
  shadow: {
    sm: "shadow-sm shadow-black/5",
    md: "shadow-md shadow-black/10",
    lg: "shadow-lg shadow-black/15",
    xl: "shadow-xl shadow-black/20",
  },
  gradient: {
    primary: "bg-gradient-to-r from-primary/90 to-primary/60",
    subtle: "bg-gradient-to-b from-background/50 to-background/30",
    glass: "bg-gradient-to-b from-white/10 to-white/5",
  },
}; 