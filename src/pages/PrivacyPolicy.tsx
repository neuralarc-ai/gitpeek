import React from "react";

const PrivacyPolicy = () => (
  <div className="container py-12 max-w-2xl mx-auto">
    <h1
      className="text-center font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
      style={{ fontSize: '2.4rem', lineHeight: 1.1 }}
    >
      PRIVACY POLICY
    </h1>
    <p className="text-sm text-muted-foreground mb-4 text-center">Effective Date: May 2025</p>
    <div className="bg-background/60 border border-border/50 rounded-lg p-6 shadow-md mb-6">
      <p className="mb-4 text-base text-foreground">
        This Privacy Policy explains how GitPeek ("we", "our", or "us") collects, uses, and protects your data when using {' '}
        <a href="https://gitpeek-six.vercel.app" className="underline text-primary" target="_blank" rel="noopener noreferrer">https://gitpeek-six.vercel.app</a> ("the Platform").
      </p>
      <h2 className="font-semibold text-primary mb-2 mt-4">3.1 What We Collect</h2>
      <ul className="list-disc pl-6 space-y-2 text-base text-muted-foreground mb-4">
        <li><b>Public GitHub Data:</b> Repositories, contributions, commits, metadata (via GitHub APIs).</li>
        <li><b>User-Provided Data:</b> GitHub usernames, search queries, and other manual inputs.</li>
        <li><b>Usage Data:</b> IP addresses, browser type, session durations, interaction patterns (e.g., clicks, page visits).</li>
      </ul>
      <p className="mb-2 text-base text-foreground">GitPeek does <b>not</b> collect:</p>
      <ul className="list-disc pl-6 space-y-2 text-base text-muted-foreground mb-4">
        <li>Passwords or GitHub credentials.</li>
        <li>Private repositories or personal access tokens (unless explicitly granted through future OAuth scopes).</li>
      </ul>
      <h2 className="font-semibold text-primary mb-2 mt-4">3.2 How We Use Your Data</h2>
      <ul className="list-disc pl-6 space-y-2 text-base text-muted-foreground mb-4">
        <li>To display and summarize GitHub profile insights.</li>
        <li>To improve the performance, accuracy, and usability of the platform.</li>
        <li>To prevent abuse, unauthorized access, or misuse of the service.</li>
        <li>To analyze traffic trends (in anonymized form) for analytics and improvement.</li>
        <li>We do not sell, rent, or trade your data.</li>
      </ul>
      <h2 className="font-semibold text-primary mb-2 mt-4">3.3 Data Sharing & Third Parties</h2>
      <p className="mb-2 text-base text-foreground">We may use third-party tools such as:</p>
      <ul className="list-disc pl-6 space-y-2 text-base text-muted-foreground mb-4">
        <li>Vercel – for deployment and serverless backend.</li>
        <li>GitHub APIs – for fetching user and repository data.</li>
        <li>OpenAI – for natural language processing and summarization.</li>
        <li>Analytics Providers – such as Google Analytics (only if implemented).</li>
      </ul>
      <p className="mb-4 text-base text-foreground">These services may collect their own data and operate under their respective privacy policies.</p>
      <h2 className="font-semibold text-primary mb-2 mt-4">3.4 Data Security</h2>
      <p className="mb-4 text-base text-foreground">We implement HTTPS, access control, and modern infrastructure security practices to safeguard your interactions. However, no platform can be guaranteed to be 100% secure.</p>
      <h2 className="font-semibold text-primary mb-2 mt-4">3.5 Your Rights</h2>
      <ul className="list-disc pl-6 space-y-2 text-base text-muted-foreground mb-4">
        <li>Deletion of your interaction history.</li>
        <li>A summary of data we may hold about you.</li>
        <li>Opt-out of future communications (if any are enabled).</li>
      </ul>
      <p className="text-base text-foreground">Contact: <a href="mailto:aditya.kemdarne@neuralarc.ai" className="underline">aditya.kemdarne@neuralarc.ai</a></p>
    </div>
  </div>
);

export default PrivacyPolicy; 