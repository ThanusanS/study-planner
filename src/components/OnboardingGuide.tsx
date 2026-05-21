import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type OnboardingStatus = {
  hasSubject: boolean;
  hasTask: boolean;
  hasExam: boolean;
};

type OnboardingGuideProps = {
  status: OnboardingStatus;
  onNavigate: (page: "subjects" | "tasks" | "exams") => void;
  onDismiss: () => void;
  onOnboardingProgress?: () => void;
};

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  status,
  onNavigate,
  onDismiss,
  onOnboardingProgress,
}) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
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
  const initialStepIndex = useMemo(() => {
    const firstIncomplete = steps.findIndex((step) => !step.done);
    return firstIncomplete === -1 ? steps.length - 1 : firstIncomplete;
  }, [steps]);

  useEffect(() => {
    if (isTourOpen) {
      setActiveStepIndex(initialStepIndex);
    }
  }, [initialStepIndex, isTourOpen]);

  const activeStep = steps[activeStepIndex];
  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < steps.length - 1;

  return (
    <Card className="relative overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_45%)]" />
      <div className="relative p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              New User Guide
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              Let&apos;s set up your study planner
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Complete each step to unlock your personalized dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
              {completedCount}/{steps.length} done
            </div>
            <Button
              size="sm"
              className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              onClick={() => setIsTourOpen(true)}
            >
              Start guide
            </Button>
          </div>
        </div>

        {/* Mobile: vertical stack. Tablet+: 3-column grid */}
        <div className="mt-4 sm:mt-5 grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`rounded-xl border p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:items-start gap-3 transition-colors ${
                step.done
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-border/60 bg-background/70"
              }`}
            >
              {/* Step number circle (mobile) */}
              <div
                className={`flex-shrink-0 w-8 h-8 sm:hidden rounded-full flex items-center justify-center text-xs font-bold ${
                  step.done
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Step {index + 1}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {step.title}
                    </div>
                  </div>
                  {step.done && (
                    <CheckCircle2 className="hidden sm:block h-4 w-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {step.description}
                </p>
              </div>

              {!step.done && (
                <Button
                  size="sm"
                  className="flex-shrink-0 sm:mt-auto sm:w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 h-8 text-xs px-3 sm:px-4"
                  onClick={() => onNavigate(step.page)}
                >
                  <span className="hidden sm:inline">{step.actionLabel}</span>
                  <span className="sm:hidden">Go</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 sm:ml-2" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 sm:mt-4 flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-xs h-8"
            onClick={onDismiss}
          >
            Skip for now
          </Button>
        </div>
      </div>

      <Dialog open={isTourOpen} onOpenChange={setIsTourOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Quick start guide</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Follow each step to set up your study planner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold text-muted-foreground">
                <span>
                  Step {activeStepIndex + 1} of {steps.length}
                </span>
                <span>{completedCount} completed</span>
              </div>
              <div className="flex gap-1.5 w-full">
                {steps.map((step, index) => (
                  <div
                    key={step.key}
                    className={`h-1.5 sm:h-2 flex-1 rounded-full transition-all duration-300 ${
                      index === activeStepIndex
                        ? "bg-indigo-600 scale-y-125"
                        : step.done
                          ? "bg-emerald-500"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/40 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-foreground">
                  {activeStep.title}
                </div>
                {activeStep.done && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {activeStep.description}
              </p>
              {!activeStep.done && (
                <Button
                  className="mt-2 w-full sm:w-auto rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 h-9 text-sm"
                  onClick={() => {
                    onNavigate(activeStep.page);
                    setIsTourOpen(false);
                  }}
                >
                  {activeStep.actionLabel}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={!canGoBack}
                className="h-8 text-xs px-2 sm:px-3"
                onClick={() =>
                  setActiveStepIndex((prev) => Math.max(prev - 1, 0))
                }
              >
                <ChevronLeft className="h-4 w-4 mr-0.5 sm:mr-1" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                className="h-8 text-xs px-2 sm:px-3"
                onClick={() =>
                  setActiveStepIndex((prev) =>
                    Math.min(prev + 1, steps.length - 1),
                  )
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-0.5 sm:ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
