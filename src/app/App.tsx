import React, { useCallback, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LandingPage } from "../components/LandingPage";
import { Auth } from "../components/Auth";
import { Dashboard } from "../components/Dashboard";
import { TasksManager } from "../components/TasksManager";
import { SubjectsManager } from "../components/SubjectsManager";
import { ExamsManager } from "../components/ExamsManager";
import { PomodoroTimer } from "../components/PomodoroTimer";
import { AiQuizGenerator } from "../components/AiQuizGenerator";
import { OnboardingGuide } from "../components/OnboardingGuide";
import { PomodoroProvider } from "../contexts/PomodoroContext";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "next-themes";
import databaseService from "../services/databaseService";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar,
  Timer,
  Sparkles,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

type Page =
  | "landing"
  | "auth"
  | "dashboard"
  | "tasks"
  | "subjects"
  | "exams"
  | "pomodoro"
  | "ai-quiz";

const Sidebar: React.FC<{
  currentPage: Page;
  onPageChange: (page: Page) => void;
}> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    onPageChange("landing");
  };

  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "subjects" as Page, label: "Subjects", icon: BookOpen },
    { id: "tasks" as Page, label: "Tasks", icon: CheckSquare },
    { id: "exams" as Page, label: "Exams", icon: Calendar },
    { id: "pomodoro" as Page, label: "Pomodoro", icon: Timer },
    { id: "ai-quiz" as Page, label: "AI Quiz", icon: Sparkles },
  ];

  // Generate dynamic initials for the user avatar
  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-4 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4.5 8.5 12 5l7.5 3.5-7.5 3.5-7.5-3.5Z" />
              <path d="M7 11.5v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3.5" />
              <path d="M19.5 9.5v4" />
              <path d="M19.5 13.5c0 .9-.7 1.6-1.6 1.6" />
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Study Planner
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Desktop Sidebar & Mobile Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card/95 border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-md ${
          mobileMenuOpen
            ? "translate-x-0 animate-in slide-in-from-left"
            : "-translate-x-full"
        } lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border hidden lg:flex">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4.5 8.5 12 5l7.5 3.5-7.5 3.5-7.5-3.5Z" />
              <path d="M7 11.5v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3.5" />
              <path d="M19.5 9.5v4" />
              <path d="M19.5 13.5c0 .9-.7 1.6-1.6 1.6" />
            </svg>
          </div>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Study Planner
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold text-muted-foreground px-3.5 uppercase tracking-widest opacity-60">
              Workspace
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => {
                      onPageChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start gap-3 h-10 px-3.5 rounded-xl transition-all duration-200 relative group overflow-hidden ${
                      isActive
                        ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border-l-2 border-indigo-500"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40 font-medium"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span className="text-sm">{item.label}</span>

                    {/* Tiny hover gradient dot for interactive styling */}
                    {!isActive && (
                      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profile Card & Bottom Actions */}
        <div className="p-4 border-t border-border mt-auto bg-background/20 dark:bg-zinc-950/20">
          <div className="flex items-center justify-between mb-4 p-2 bg-background/55 dark:bg-zinc-900/30 rounded-2xl border border-border/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/10 shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold truncate text-foreground leading-tight">
                  {user?.name || "Test User"}
                </div>
                <div className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                  {user?.email || "student@academy.com"}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-accent"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-amber-500" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-muted-foreground" />
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 rounded-xl h-9.5 text-xs transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Account
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState({
    hasSubject: false,
    hasTask: false,
    hasExam: false,
  });

  const loadOnboardingStatus = useCallback(async () => {
    if (!user) return;
    const resolvedUserId = user.$id || (user as any)?.id;
    if (!resolvedUserId) return;

    try {
      const [subjects, tasks, exams] = await Promise.all([
        databaseService.getSubjects(resolvedUserId),
        databaseService.getTasks(resolvedUserId, 1),
        databaseService.getExams(resolvedUserId),
      ]);

      const nextStatus = {
        hasSubject: subjects.length > 0,
        hasTask: tasks.length > 0,
        hasExam: exams.length > 0,
      };
      setOnboardingStatus(nextStatus);

      if (typeof window === "undefined") return;
      const storageKey = `studyPlannerOnboarding:${resolvedUserId}`;
      const stored = window.localStorage.getItem(storageKey);

      if (stored === "completed") {
        setShowOnboarding(false);
        return;
      }

      const isBrandNew =
        !nextStatus.hasSubject &&
        !nextStatus.hasTask &&
        !nextStatus.hasExam;

      if (stored !== "active" && isBrandNew) {
        window.localStorage.setItem(storageKey, "active");
        setShowOnboarding(true);
        return;
      }

      if (stored === "active") {
        const completed =
          nextStatus.hasSubject &&
          nextStatus.hasTask &&
          nextStatus.hasExam;
        if (completed) {
          window.localStorage.setItem(storageKey, "completed");
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error loading onboarding status:", error);
    }
  }, [user]);

  // Auto-redirect to dashboard when user logs in
  React.useEffect(() => {
    if (user && (currentPage === "landing" || currentPage === "auth")) {
      setCurrentPage("dashboard");
    }
  }, [user, currentPage]);

  React.useEffect(() => {
    if (user) {
      loadOnboardingStatus();
    } else {
      setShowOnboarding(false);
    }
  }, [user, loadOnboardingStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not logged in and on landing page
  if (!user && currentPage === "landing") {
    return <LandingPage onGetStarted={() => setCurrentPage("auth")} />;
  }

  // Show auth page if not logged in and user clicked get started
  if (!user) {
    return <Auth onBackToHome={() => setCurrentPage("landing")} />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 w-full min-w-0 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          {showOnboarding && (
            <OnboardingGuide
              status={onboardingStatus}
              onNavigate={(page) => setCurrentPage(page)}
              onDismiss={() => {
                const resolvedUserId = user?.$id || (user as any)?.id;
                if (resolvedUserId && typeof window !== "undefined") {
                  window.localStorage.setItem(
                    `studyPlannerOnboarding:${resolvedUserId}`,
                    "completed",
                  );
                }
                setShowOnboarding(false);
              }}
            />
          )}
          {currentPage === "dashboard" && (
            <Dashboard
              onOpenAiQuiz={() => setCurrentPage("ai-quiz")}
              onOnboardingProgress={loadOnboardingStatus}
            />
          )}
          {currentPage === "tasks" && (
            <TasksManager onOnboardingProgress={loadOnboardingStatus} />
          )}
          {currentPage === "subjects" && (
            <SubjectsManager onOnboardingProgress={loadOnboardingStatus} />
          )}
          {currentPage === "exams" && (
            <ExamsManager onOnboardingProgress={loadOnboardingStatus} />
          )}
          {currentPage === "pomodoro" && <PomodoroTimer />}
          {currentPage === "ai-quiz" && <AiQuizGenerator />}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>
        <PomodoroProvider>
          <AppContent />
          <Toaster />
        </PomodoroProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
