import { Github } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full border-t border-gitpeek-border py-4">
      <div className="container flex flex-wrap items-center justify-center gap-3 text-muted-foreground text-sm text-center">
        <Link to="/terms-of-use" className="underline">Terms of use</Link>
        <span className="mx-1">•</span>
        <Link to="/privacy-policy" className="underline">Privacy Policy</Link>
        <span className="mx-1">•</span>
        <Link to="/disclaimer" className="underline">Disclaimer</Link>
        <span className="mx-1">•</span>
        <Link to="/responsible-ai" className="underline">Responsible AI</Link>
        <span className="mx-1">•</span>
        <span>Copyright 2025. All rights reserved.</span>
        <span className="inline">GitPeek, a thing by</span>
        <img src="NLogo.jpg" alt="NeuralArc" className="h-5 ml-1 inline" />
      </div>
    </footer>
  );
} 