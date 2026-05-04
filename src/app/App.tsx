import React, { useState } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LandingPage } from "../components/LandingPage";
import { Auth } from "../components/Auth";
import { Dashboard } from "../components/Dashboard";
import { TasksManager } from "../components/TasksManager";
import { SubjectsManager } from "../components/SubjectsManager";
import { ExamsManager } from "../components/ExamsManager";
import { PomodoroTimer } from "../components/PomodoroTimer";
import { PomodoroProvider } from "../contexts/PomodoroContext";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "next-themes";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Calendar,
  Timer,
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
  | "pomodoro";

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
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
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
          <span className="font-semibold text-lg tracking-tight">
            Study Planner
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar & Mobile Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex`}
      >
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border hidden lg:flex">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
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
          <span className="font-semibold text-lg tracking-tight">
            Study Planner
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "secondary" : "ghost"}
              onClick={() => {
                onPageChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full justify-start gap-3 h-10 px-3 ${
                currentPage === item.id ? "font-medium" : "text-muted-foreground font-normal"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  // Auto-redirect to dashboard when user logs in
  React.useEffect(() => {
    if (user && (currentPage === "landing" || currentPage === "auth")) {
      setCurrentPage("dashboard");
    }
  }, [user, currentPage]);

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
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "tasks" && <TasksManager />}
          {currentPage === "subjects" && <SubjectsManager />}
          {currentPage === "exams" && <ExamsManager />}
          {currentPage === "pomodoro" && <PomodoroTimer />}
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
