import React, { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Sparkles,
  MoreHorizontal,
  BookOpen,
  Calendar,
  Users,
  FileUp,
  FileText,
  Map,
  GraduationCap,
  CreditCard,
  X,
} from "lucide-react";

type Page =
  | "dashboard"
  | "tasks"
  | "subjects"
  | "exams"
  | "pomodoro"
  | "ai-quiz"
  | "ai-notes"
  | "ai-roadmap"
  | "ai-tutor"
  | "billing"
  | "ai-doc-hub"
  | "co-study";

interface BottomTabBarProps {
  currentPage: Page | string;
  onPageChange: (page: Page) => void;
}

const mainTabs = [
  { id: "dashboard" as Page, label: "Home", icon: LayoutDashboard },
  { id: "tasks" as Page, label: "Tasks", icon: CheckSquare },
  { id: "pomodoro" as Page, label: "Focus", icon: Timer },
  { id: "ai-quiz" as Page, label: "AI", icon: Sparkles },
];

const moreItems = [
  { id: "subjects" as Page, label: "Subjects", icon: BookOpen },
  { id: "exams" as Page, label: "Exams", icon: Calendar },
  { id: "co-study" as Page, label: "Co-Study", icon: Users },
  { id: "ai-doc-hub" as Page, label: "AI Doc Hub", icon: FileUp },
  { id: "ai-notes" as Page, label: "AI Notes", icon: FileText },
  { id: "ai-roadmap" as Page, label: "AI Roadmap", icon: Map },
  { id: "ai-tutor" as Page, label: "AI Tutor", icon: GraduationCap },
  { id: "billing" as Page, label: "Billing", icon: CreditCard },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentPage,
  onPageChange,
}) => {
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => item.id === currentPage);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="mx-3 mb-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                More Features
              </span>
              <button
                onClick={() => setShowMore(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-3">
              {moreItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setShowMore(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-500" : ""}`} />
                    <span className={`text-[10px] leading-tight text-center ${isActive ? "font-bold" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainTabs.map((tab) => {
            const isActive = currentPage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onPageChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-500/10 dark:bg-indigo-500/15"
                      : ""
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? "text-indigo-500" : ""}`} />
                </div>
                <span
                  className={`text-[10px] leading-none ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
              isMoreActive || showMore
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                isMoreActive || showMore
                  ? "bg-indigo-500/10 dark:bg-indigo-500/15"
                  : ""
              }`}
            >
              <MoreHorizontal className={`w-5 h-5 ${isMoreActive || showMore ? "text-indigo-500" : ""}`} />
            </div>
            <span
              className={`text-[10px] leading-none ${
                isMoreActive || showMore ? "font-bold" : "font-medium"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
