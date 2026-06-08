import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import databaseService from "../services/databaseService";

const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  dailyGoal: 4,
};

const SETTINGS_STORAGE_KEY = "pomodoroSettings";

type TimerMode = "focus" | "break";
type BreakType = "short" | "long";

interface PomodoroContextValue {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  selectedSubject: string;
  lastCompletedAt: number | null;
  breakType: BreakType;
  settings: typeof DEFAULT_SETTINGS;
  setSelectedSubject: (value: string) => void;
  updateSettings: (settings: typeof DEFAULT_SETTINGS) => void;
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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [breakType, setBreakType] = useState<BreakType>("short");
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [lastCompletedAt, setLastCompletedAt] = useState<number | null>(null);

  const modeRef = useRef(mode);
  const sessionStartRef = useRef<Date | null>(sessionStart);
  const selectedSubjectRef = useRef(selectedSubject);
  const settingsRef = useRef(settings);
  const breakTypeRef = useRef(breakType);
  const cycleCountRef = useRef(cycleCount);
  const timeLeftRef = useRef(timeLeft);
  const expectedEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    sessionStartRef.current = sessionStart;
  }, [sessionStart]);

  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    breakTypeRef.current = breakType;
  }, [breakType]);

  useEffect(() => {
    cycleCountRef.current = cycleCount;
  }, [cycleCount]);

  useEffect(() => {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as typeof DEFAULT_SETTINGS;
      const next = {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
      setSettings(next);
      setTimeLeft(next.focusMinutes * 60);
    } catch (error) {
      console.error("Error reading pomodoro settings:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsRunning(false);
      setMode("focus");
      setTimeLeft(settingsRef.current.focusMinutes * 60);
      setSelectedSubject("");
      setSessionStart(null);
      setBreakType("short");
      setCycleCount(0);
    }
  }, [user]);

  const getDurationSeconds = (
    nextMode: TimerMode,
    nextBreakType: BreakType,
    nextSettings: typeof DEFAULT_SETTINGS,
  ) => {
    if (nextMode === "focus") {
      return nextSettings.focusMinutes * 60;
    }
    return (
      (nextBreakType === "long"
        ? nextSettings.longBreakMinutes
        : nextSettings.breakMinutes) * 60
    );
  };

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

      const nextCycleCount = cycleCountRef.current + 1;
      const shouldLongBreak =
        nextCycleCount >= settingsRef.current.cyclesBeforeLongBreak;

      setSessionStart(null);
      setMode("break");
      setBreakType(shouldLongBreak ? "long" : "short");
      setTimeLeft(
        getDurationSeconds(
          "break",
          shouldLongBreak ? "long" : "short",
          settingsRef.current,
        ),
      );
      setCycleCount(shouldLongBreak ? 0 : nextCycleCount);
      setLastCompletedAt(Date.now());
    } else {
      setMode("focus");
      setBreakType("short");
      setTimeLeft(getDurationSeconds("focus", "short", settingsRef.current));
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

    if (expectedEndTimeRef.current === null) {
      expectedEndTimeRef.current = Date.now() + timeLeftRef.current * 1000;
    }

    const updateTimer = () => {
      const remainingMs = expectedEndTimeRef.current! - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        expectedEndTimeRef.current = null;
        handleTimerComplete();
      }
    };

    const intervalId = setInterval(updateTimer, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning]);

  const start = () => {
    if (modeRef.current === "focus" && !sessionStartRef.current) {
      setSessionStart(new Date());
    }
    expectedEndTimeRef.current = Date.now() + timeLeftRef.current * 1000;
    setIsRunning(true);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const pause = () => {
    if (expectedEndTimeRef.current !== null) {
      const remainingMs = expectedEndTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(remainingSecs);
    }
    expectedEndTimeRef.current = null;
    setIsRunning(false);
  };

  const reset = () => {
    expectedEndTimeRef.current = null;
    setIsRunning(false);
    setSessionStart(null);
    setTimeLeft(
      getDurationSeconds(
        modeRef.current,
        breakTypeRef.current,
        settingsRef.current,
      ),
    );
  };

  const updateSettings = (nextSettings: typeof DEFAULT_SETTINGS) => {
    setSettings(nextSettings);
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );

    if (!isRunning) {
      setTimeLeft(
        getDurationSeconds(modeRef.current, breakTypeRef.current, nextSettings),
      );
    } else {
      const durationSecs = getDurationSeconds(modeRef.current, breakTypeRef.current, nextSettings);
      expectedEndTimeRef.current = Date.now() + durationSecs * 1000;
      setTimeLeft(durationSecs);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        timeLeft,
        isRunning,
        selectedSubject,
        lastCompletedAt,
        breakType,
        settings,
        setSelectedSubject,
        updateSettings,
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
