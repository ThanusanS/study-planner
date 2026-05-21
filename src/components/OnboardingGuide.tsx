import React from "react";
import { Card } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

type OnboardingStatus = {
  hasSubject: boolean;
  hasTask: boolean;
  hasExam: boolean;
};

type OnboardingGuideProps = {
  status: OnboardingStatus;
  onNavigate: (page: "subjects" | "tasks" | "exams") => void;
  onDismiss: () => void;
};

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  status,
  onNavigate,
  onDismiss,
}) => {
  const steps = [
    {
      key: "subject",
      title: "Create your first subject",
      description: "Start by adding a class or topic you want to track.",
      done: status.hasSubject,
      actionLabel: "Add subject",
      page: "subjects" as const,
    },
    {
      key: "task",
      title: "Add a task",
      description: "Break the subject into tasks to get daily focus.",
      done: status.hasTask,
      actionLabel: "Add task",
      page: "tasks" as const,
    },
    {
      key: "exam",
      title: "Schedule an exam",
      description: "Set a date so your timeline stays visible.",
      done: status.hasExam,
      actionLabel: "Add exam",
      page: "exams" as const,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;

  return (
    <Card className="relative overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_45%)]" />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              New User Guide
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Let&apos;s set up your study planner
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete each step to unlock your personalized dashboard.
            </p>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {completedCount}/{steps.length} steps completed
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                step.done
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-border/60 bg-background/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Step {index + 1}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {step.title}
                  </div>
                </div>
                {step.done && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
              {!step.done && (
                <Button
                  size="sm"
                  className="mt-auto rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                  onClick={() => onNavigate(step.page)}
                >
                  {step.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </Card>
  );
};
