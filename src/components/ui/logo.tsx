
import { GitBranch } from "lucide-react";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-4xl"
  };

  return (
    <div className="flex items-center gap-2">
      <GitBranch className={`text-gitpeek-blue ${size === "large" ? "h-10 w-10" : size === "small" ? "h-5 w-5" : "h-6 w-6"}`} />
      <span className={`font-bold tracking-tight ${sizeClasses[size]}`}>
        Git<span className="gradient-text">peek</span>
      </span>
    </div>
  );
}
