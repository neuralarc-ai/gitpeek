import { GitBranch } from "lucide-react";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" | "xlarge" }) {
  const sizeClasses = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-5xl",
    xlarge: "text-6xl"
  };

  return (
    <div className="flex items-center gap-2">
      <GitBranch className={`text-gitpeek-blue ${size === "xlarge" ? "h-20 w-20" : size === "large" ? "h-13 w-13" : size === "small" ? "h-5 w-5" : "h-8 w-8"}`} />
      <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>
        Git<span className="gradient-text">peek</span>
      </span>
    </div>
  );
}
