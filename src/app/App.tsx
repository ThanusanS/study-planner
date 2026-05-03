import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LandingPage } from '../components/LandingPage';
import { Auth } from '../components/Auth';
import { Dashboard } from '../components/Dashboard';
import { TasksManager } from '../components/TasksManager';
import { SubjectsManager } from '../components/SubjectsManager';
import { ExamsManager } from '../components/ExamsManager';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { PomodoroProvider } from '../contexts/PomodoroContext';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
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
  X
} from 'lucide-react';
import { useTheme } from 'next-themes';

type Page = 'landing' | 'auth' | 'dashboard' | 'tasks' | 'subjects' | 'exams' | 'pomodoro';

const Navigation: React.FC<{
  currentPage: Page;
  onPageChange: (page: Page) => void;
}> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    onPageChange('landing');
  };

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as Page, label: 'Tasks', icon: CheckSquare },
    { id: 'subjects' as Page, label: 'Subjects', icon: BookOpen },
    { id: 'exams' as Page, label: 'Exams', icon: Calendar },
    { id: 'pomodoro' as Page, label: 'Pomodoro', icon: Timer },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
              <span className="font-bold text-xl hidden sm:block">Study Planner</span>
            </div>

            <div className="hidden md:flex gap-1">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  onClick={() => {
                    onPageChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 space-y-2">
            {navItems.map(item => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                onClick={() => {
                  onPageChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  // Auto-redirect to dashboard when user logs in
  React.useEffect(() => {
    if (user && (currentPage === 'landing' || currentPage === 'auth')) {
      setCurrentPage('dashboard');
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
  if (!user && currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('auth')} />;
  }

  // Show auth page if not logged in and user clicked get started
  if (!user) {
    return <Auth onBackToHome={() => setCurrentPage('landing')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'tasks' && <TasksManager />}
        {currentPage === 'subjects' && <SubjectsManager />}
        {currentPage === 'exams' && <ExamsManager />}
        {currentPage === 'pomodoro' && <PomodoroTimer />}
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