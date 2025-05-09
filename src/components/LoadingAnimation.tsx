
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

type Step = {
  id: number;
  label: string;
  status: "waiting" | "loading" | "complete";
};

export function LoadingAnimation() {
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: "Fetching Repository", status: "waiting" },
    { id: 2, label: "Running Code Analysis", status: "waiting" },
    { id: 3, label: "Parsing Project Structure", status: "waiting" },
    { id: 4, label: "Extracting Documentation", status: "waiting" },
    { id: 5, label: "Compiling Results", status: "waiting" },
  ]);
  
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) return;

    // Mark the current step as loading
    setSteps(prevSteps =>
      prevSteps.map((step, i) =>
        i === currentStep ? { ...step, status: "loading" } : step
      )
    );

    // After a delay, mark as complete and move to next step
    const timer = setTimeout(() => {
      setSteps(prevSteps =>
        prevSteps.map((step, i) =>
          i === currentStep ? { ...step, status: "complete" } : step
        )
      );
      setCurrentStep(prev => prev + 1);
    }, 1500); // Each step takes 1.5 seconds

    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col space-y-4">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`flex items-center space-x-3 p-3 rounded-md transition-all duration-300
            ${step.status === 'loading' ? 'bg-gitpeek-blue/10 border border-gitpeek-blue/30' : 
              step.status === 'complete' ? 'bg-gitpeek-blue/5' : ''}`}
          >
            {step.status === "loading" && (
              <Loader2 className="h-5 w-5 text-gitpeek-blue animate-spin" />
            )}
            {step.status === "complete" && (
              <CheckCircle className="h-5 w-5 text-gitpeek-blue" />
            )}
            {step.status === "waiting" && (
              <div className="h-5 w-5 rounded-full border border-muted-foreground/30"></div>
            )}
            <span className={`
              ${step.status === 'loading' ? 'text-gitpeek-blue font-medium' : 
                step.status === 'complete' ? 'text-muted-foreground' : 
                'text-muted-foreground/50'}`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
