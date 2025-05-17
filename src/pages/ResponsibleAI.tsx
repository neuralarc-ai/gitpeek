import React from "react";

const ResponsibleAI = () => (
  <div className="container py-12 max-w-2xl mx-auto">
    <h1
      className="text-center font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
      style={{ fontSize: '2.4rem', lineHeight: 1.1 }}
    >
      RESPONSIBLE AI USE POLICY
    </h1>
    <p className="mb-6 text-base text-foreground text-center">
      GitPeek leverages artificial intelligence to provide fast, data-driven insights about developers and repositories. We are committed to using AI responsibly and expect the same from our users.
    </p>
    <div className="bg-background/60 border border-border/50 rounded-lg p-6 shadow-md mb-6">
      <p className="mb-4 font-semibold text-primary">As a user, you agree NOT to:</p>
      <ul className="list-disc pl-6 space-y-3 text-base text-muted-foreground mb-4">
        <li>Use GitPeek to impersonate others, or misrepresent their skills, history, or behavior.</li>
        <li>Input sensitive or proprietary data into the platform.</li>
        <li>Use the platform to build unfair, discriminatory, or automated profiling systems (e.g., hiring filters or candidate blacklisting).</li>
        <li>Scrape, misuse, or harvest data from public repositories beyond GitHub's own acceptable use policies.</li>
        <li>Attempt to exploit or reverse engineer GitPeek's AI systems.</li>
      </ul>
      <p className="mb-4 font-semibold text-primary">We reserve the right to:</p>
      <ul className="list-disc pl-6 space-y-3 text-base text-muted-foreground">
        <li>Suspend or terminate your access if misuse is suspected.</li>
        <li>Modify or restrict features to ensure ethical usage.</li>
        <li>Share aggregate usage analytics with trusted third parties, excluding personally identifiable information.</li>
      </ul>
    </div>
  </div>
);

export default ResponsibleAI; 