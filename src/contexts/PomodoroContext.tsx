import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import databaseService from "../services/databaseService";

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

type TimerMode = "focus" | "break";

interface PomodoroContextValue {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  selectedSubject: string;
  lastCompletedAt: number | null;
  setSelectedSubject: (value: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | undefined>(
  undefined,
);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);

  const modeRef = useRef(mode);
  const sessionStartRef = useRef<Date | null>(sessionStart);
  const selectedSubjectRef = useRef(selectedSubject);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    sessionStartRef.current = sessionStart;
  }, [sessionStart]);

  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  useEffect(() => {
    if (!user) {
      setIsRunning(false);
      setMode("focus");
      setTimeLeft(FOCUS_TIME);
      setSelectedSubject("");
      setSessionStart(null);
    }
  }, [user]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (modeRef.current === "focus" && sessionStartRef.current && user) {
      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - sessionStartRef.current.getTime()) / 1000 / 60,
      );

      try {
        await databaseService.createPomodoroSession({
          userId: user.$id,
          subjectId: selectedSubjectRef.current || undefined,
          startTime: sessionStartRef.current.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error saving session:", error);
      }

      setSessionStart(null);
      setMode("break");
      setTimeLeft(BREAK_TIME);
      setLastCompletedAt(Date.now());
    } else {
      setMode("focus");
      setTimeLeft(FOCUS_TIME);
      setLastCompletedAt(Date.now());
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pomodoro Timer", {
        body:
          modeRef.current === "focus"
            ? "Focus session complete! Time for a break."
            : "Break is over! Ready to focus?",
      });
    }
  };

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const start = () => {
    if (modeRef.current === "focus" && !sessionStartRef.current) {
      setSessionStart(new Date());
    }
    setIsRunning(true);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setSessionStart(null);
    setTimeLeft(modeRef.current === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        timeLeft,
        isRunning,
        selectedSubject,
        lastCompletedAt,
        setSelectedSubject,
        start,
        pause,
        reset,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error("usePomodoro must be used within PomodoroProvider");
  }
  return context;
};
