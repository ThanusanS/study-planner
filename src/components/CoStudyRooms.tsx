import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../app/components/ui/dialog";
import {
  Users,
  Timer,
  Volume2,
  MessageSquare,
  Sparkles,
  Lock,
  PlusCircle,
  Tv,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Send,
  Coffee,
  Crown,
  Trash2,
  Radio,
  Volume1
} from "lucide-react";
import planService, { UserPlan } from "../services/planService";
import coStudyService, { StudyRoom, StudyRoomMessage, StudyRoomMember } from "../services/coStudyService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

// Pre-defined YouTube Embed streams for Lofi/Ambient Music and FM Radios
const LOFI_PRESETS = [
  { id: "lofi-girl", name: "Lofi Girl Radio", url: "https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1" },
  { id: "synthwave", name: "Synthwave Radio", url: "https://www.youtube.com/embed/F3Hk1Q-8mXk?autoplay=1" },
  { id: "piano", name: "Classical Study", url: "https://www.youtube.com/embed/z0ESIdRVkOg?autoplay=1" },
  { id: "rain", name: "Rain Ambient", url: "https://www.youtube.com/embed/WJ3-F02-F_Y?autoplay=1" },
  { id: "sirasa-fm", name: "Sirasa FM", url: "https://radio.garden/api/ara/content/listen/ZBLzLpft/channel.mp3", isRadio: true },
  { id: "hiru-fm", name: "Hiru FM", url: "https://radio.garden/api/ara/content/listen/xyIbSGbn/channel.mp3", isRadio: true },
  { id: "shakthi-fm", name: "Shakthi FM", url: "https://radio.garden/api/ara/content/listen/BlDkcUEv/channel.mp3", isRadio: true },
  { id: "sooriyan-fm", name: "Sooriyan FM", url: "https://radio.garden/api/ara/content/listen/cuRx6MpV/channel.mp3", isRadio: true }
];

// Helper to extract 11-char Video ID from YouTube URLs
const getYoutubeVideoId = (url: string): string => {
  if (!url) return "";
  const cleanUrl = url.trim();
  if (cleanUrl.length === 11 && !cleanUrl.includes("/") && !cleanUrl.includes("?")) {
    return cleanUrl;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
};

export const CoStudyRooms: React.FC<{ onNavigateToBilling?: () => void }> = ({ onNavigateToBilling }) => {
  const { user } = useAuth();
  const userId = user?.$id || (user as any)?.id || "test-user";
  const userName = user?.name || "Achiever Student";
  
  // Plans and billing gating
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);
  const [isGatingDialogOpen, setIsGatingDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Active rooms lists
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Create room form
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);

  // Active room session
  const [joinedRoom, setJoinedRoom] = useState<StudyRoom | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"focus" | "chat">("focus");
  const [musicPreset, setMusicPreset] = useState(LOFI_PRESETS[0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isAudioPlayingState, setIsAudioPlayingState] = useState(true);
  const [isAudioConnecting, setIsAudioConnecting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize audio element playback state with react state
  useEffect(() => {
    if (audioRef.current) {
      if (isAudioPlayingState) {
        audioRef.current.play().catch((err) => {
          console.warn("Audio playback failed or was interrupted:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }

    // Cleanup on unmount or stream change
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isAudioPlayingState, musicPreset.url]);

  // Pomodoro timer states inside joined room
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");

  // Refs to avoid stale closures in the timer interval
  const minutesRef = useRef(minutes);
  const secondsRef = useRef(seconds);
  const timerModeRef = useRef(timerMode);
  const joinedRoomRef = useRef(joinedRoom);
  const targetEndTimeRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => { minutesRef.current = minutes; }, [minutes]);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);
  useEffect(() => { timerModeRef.current = timerMode; }, [timerMode]);
  useEffect(() => { joinedRoomRef.current = joinedRoom; }, [joinedRoom]);

  // Chat log states
  const [chatLogs, setChatLogs] = useState<StudyRoomMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Room peers
  const [peers, setPeers] = useState<StudyRoomMember[]>([]);

  // Subscription unsubscribe function holders
  const unsubMsgRef = useRef<(() => void) | null>(null);
  const unsubMembersRef = useRef<(() => void) | null>(null);
  const unsubTimerRef = useRef<(() => void) | null>(null);
  const isSendingRef = useRef(false);

  // Load User Plan and Rooms
  useEffect(() => {
    if (userId) {
      planService.getUserPlan(userId).then(setActivePlan);
    }
    loadRooms();

    // Subscribe to all study rooms updates in real-time (Appwrite & Local fallback)
    const unsubscribe = coStudyService.subscribeToRooms(() => {
      loadRooms();
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Check for deep-linked pending join room
  useEffect(() => {
    if (joinedRoom) return;
    const pendingRoomId = window.localStorage.getItem("study_planner_pending_join_room");
    if (pendingRoomId) {
      window.localStorage.removeItem("study_planner_pending_join_room");
      toast.info("Connecting to invited study space...");
      coStudyService.getRoomById(pendingRoomId).then((room) => {
        if (room) {
          handleJoinRoom(room);
        } else {
          toast.error("Study room not found or has been closed.");
        }
      }).catch((err) => {
        console.error(err);
        toast.error("Failed to load study room.");
      });
    }
  }, [joinedRoom, rooms]);

  // Scroll to bottom of chat (scoped to chat container only, not the page)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatLogs]);

  // Load Rooms list from database
  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const list = await coStudyService.getRooms(userId);
      setRooms(list);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load Members list inside room
  const loadMembers = async (roomId: string) => {
    try {
      const list = await coStudyService.getRoomMembers(roomId);
      // Filter out self if desired or keep it, since it's cleaner to show all
      setPeers(list.filter(m => m.userId !== userId));
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  };

  // Load Chat messages
  const loadChat = async (roomId: string) => {
    try {
      const list = await coStudyService.getMessages(roomId);
      
      // Filter out TIMER_SYNC signaling messages from general chat display
      const chatMessages = list.filter(m => !m.message.startsWith("TIMER_SYNC:"));
      setChatLogs(chatMessages);

      // Extract the last synchronization signal to catch up hot-joining peers
      const lastSync = [...list].reverse().find(m => m.message.startsWith("TIMER_SYNC:"));
      if (lastSync && joinedRoom && joinedRoom.creatorId !== userId) {
        handleTimerSyncMessage(lastSync.message);
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  const handleTimerSyncMessage = (syncString: string) => {
    const parts = syncString.split(":");
    if (parts.length < 5) return;

    const action = parts[1]; // PLAY, PAUSE, RESET, SWITCH
    
    if (action === "PLAY") {
      const mins = parseInt(parts[2], 10);
      const secs = parseInt(parts[3], 10);
      const isoTime = parts.slice(4).join(":");
      
      try {
        const timeMs = new Date(isoTime).getTime();
        if (!isNaN(timeMs)) {
          const elapsedMs = Date.now() - timeMs;
          const elapsedSecs = Math.floor(elapsedMs / 1000);
          const totalRemainingSecs = (mins * 60) + secs - elapsedSecs;

          if (totalRemainingSecs > 0) {
            setMinutes(Math.floor(totalRemainingSecs / 60));
            setSeconds(totalRemainingSecs % 60);
            targetEndTimeRef.current = Date.now() + totalRemainingSecs * 1000;
            setTimerActive(true);
          } else {
            setMinutes(0);
            setSeconds(0);
            targetEndTimeRef.current = null;
            setTimerActive(false);
          }
        }
      } catch (err) {
        console.error("Failed to parse sync time:", err);
      }
    } else if (action === "PAUSE") {
      const mins = parseInt(parts[2], 10);
      const secs = parseInt(parts[3], 10);
      setMinutes(mins);
      setSeconds(secs);
      targetEndTimeRef.current = null;
      setTimerActive(false);
    } else if (action === "RESET") {
      const mins = parseInt(parts[2], 10);
      const secs = parseInt(parts[3], 10);
      setMinutes(mins);
      setSeconds(secs);
      setTimerMode("work");
      targetEndTimeRef.current = null;
      setTimerActive(false);
    } else if (action === "SWITCH") {
      const mode = parts[2] as "work" | "break";
      const mins = parseInt(parts[3], 10);
      const secs = parseInt(parts[4], 10);
      setTimerMode(mode);
      setMinutes(mins);
      setSeconds(secs);
      targetEndTimeRef.current = null;
      setTimerActive(false);
    }
  };

  const sendTimerSyncSignal = async (action: string, mins: number, secs: number, extra?: string) => {
    if (!joinedRoom) return;
    const isoTime = new Date().toISOString();
    let messageContent = `TIMER_SYNC:${action}:${mins}:${secs}:${isoTime}`;
    if (action === "SWITCH") {
      messageContent = `TIMER_SYNC:SWITCH:${extra}:${mins}:${secs}:${isoTime}`;
    }

    try {
      await coStudyService.sendMessage({
        roomId: joinedRoom.$id!,
        senderId: "system",
        senderName: "Focus Bot",
        message: messageContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });
    } catch (err) {
      console.error("Failed to send timer sync signal:", err);
    }
  };

  // Pomodoro Timer Engine — uses refs to avoid stale closures and background throttling
  useEffect(() => {
    if (!timerActive) return;

    if (targetEndTimeRef.current === null) {
      targetEndTimeRef.current = Date.now() + (minutesRef.current * 60 + secondsRef.current) * 1000;
    }

    const updateRoomTimerLocal = () => {
      const remainingMs = targetEndTimeRef.current! - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
      
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;

      setMinutes(mins);
      setSeconds(secs);

      const currentRoom = joinedRoomRef.current;
      const isHost = currentRoom && currentRoom.creatorId === userId;

      if (remainingSecs <= 0) {
        targetEndTimeRef.current = null;
        triggerTimerCompletion(isHost);
      }
    };

    // Run every 500ms to ensure responsiveness
    const interval = setInterval(updateRoomTimerLocal, 500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateRoomTimerLocal();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      targetEndTimeRef.current = null;
    };
  }, [timerActive]);

  // Real-time Presence heartbeat pulses (every 15s) and idle pruner
  useEffect(() => {
    if (!joinedRoom) return;

    // Send initial pulse
    coStudyService.pulsePresence(joinedRoom.$id!, userId);

    const pulseInterval = setInterval(() => {
      // Pulse presence
      coStudyService.pulsePresence(joinedRoom.$id!, userId);
      // Prune inactive ghosts
      coStudyService.pruneInactiveMembers(joinedRoom.$id!);
    }, 15000);

    return () => clearInterval(pulseInterval);
  }, [joinedRoom]);

  // Trigger sound alert and timer mode changes when timer ends
  const triggerTimerCompletion = async (isHost: boolean | null) => {
    setTimerActive(false);
    
    // Play alert sound (HTML5 Audio API)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.30); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);
    } catch (soundErr) {
      console.warn("Sound alert blocked by browser media policies", soundErr);
    }

    // Read current values from refs to avoid stale closures
    const currentTimerMode = timerModeRef.current;
    const currentRoom = joinedRoomRef.current;

    const nextMode = currentTimerMode === "work" ? "break" : "work";
    setTimerMode(nextMode);
    setMinutes(nextMode === "work" ? 25 : 5);
    setSeconds(0);

    if (nextMode === "break") {
      toast.success("Focus Session Complete! Take a break.");
      if (isHost && currentRoom) {
        await coStudyService.updateRoomTimer(currentRoom.$id!, { timerMode: "break" });
        await coStudyService.sendMessage({
          roomId: currentRoom.$id!,
          senderId: "system",
          senderName: "Focus Bot",
          message: "🚨 Focus block finished. Commencing 5-minute recovery break!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }
    } else {
      toast.info("Break finished! Time to study.");
      if (isHost && currentRoom) {
        await coStudyService.updateRoomTimer(currentRoom.$id!, { timerMode: "work" });
        await coStudyService.sendMessage({
          roomId: currentRoom.$id!,
          senderId: "system",
          senderName: "Focus Bot",
          message: "⚡ Break finished. Commencing 25-minute study block. Focus up!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }
    }
  };

  // Join Room Action (Real-time subscriptions registration)
  const handleJoinRoom = async (room: StudyRoom) => {
    if (!room) {
      toast.error("Unable to join: room details are invalid or missing.");
      return;
    }

    // 1. Leave any active room cleanups
    if (joinedRoom) {
      await handleLeaveRoom();
    }

    setJoinedRoom(room);
    setTimerActive(false);
    setTimerMode(room.timerMode);
    setMinutes(room.timerMode === "work" ? 25 : 5);
    setSeconds(0);
    setIsMusicPlaying(false);

    try {
      // 2. Write presence to DB
      await coStudyService.joinRoom(room.$id!, userId, userName);

      // 3. Load initial logs and participants
      await Promise.all([
        loadMembers(room.$id!),
        loadChat(room.$id!)
      ]);

      // Send join announcement in chat
      await coStudyService.sendMessage({
        roomId: room.$id!,
        senderId: "system",
        senderName: "Focus Bot",
        message: `👋 ${userName} has joined the study room.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });

      // 4. Register WebSocket/Event listeners for active updates
      unsubMsgRef.current = coStudyService.subscribeToMessages(room.$id!, (newMsg) => {
        // Intercept timer sync signals
        if (newMsg.message.startsWith("TIMER_SYNC:")) {
          const isHost = room.creatorId === userId;
          if (!isHost) {
            handleTimerSyncMessage(newMsg.message);
          }
          return; // Suppress from chat log state
        }

        setChatLogs(prev => {
          if (prev.some(m => m.$id === newMsg.$id)) return prev;

          // Check if we have an optimistic temp message matching this message
          const tempIdx = prev.findIndex(m => 
            m.$id?.startsWith("temp-") && 
            m.senderId === newMsg.senderId && 
            m.message === newMsg.message
          );

          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = newMsg;
            return updated;
          }

          return [...prev, newMsg];
        });
      });

      unsubMembersRef.current = coStudyService.subscribeToMembers(room.$id!, () => {
        loadMembers(room.$id!);
      });

      unsubTimerRef.current = coStudyService.subscribeToRoomTimer(room.$id!, (newTimerMode) => {
        // Master timer sync updates
        setTimerMode(newTimerMode);
        setMinutes(newTimerMode === "work" ? 25 : 5);
        setSeconds(0);
        setTimerActive(false); // reset trigger on remote changes
        toast.info(`Timer mode synced to: ${newTimerMode === "work" ? "Focus Block" : "Break Block"}`);
      });

      toast.success(`Joined study space: ${room.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to study room session.");
    }
  };

  // Leave Room Action (Unsubscribe cleaners)
  const handleLeaveRoom = async () => {
    if (!joinedRoom) return;
    const roomRef = joinedRoom;
    setJoinedRoom(null);
    setTimerActive(false);
    setIsMusicPlaying(false);
    setChatLogs([]);
    setPeers([]);

    // Stop any playing radio audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsAudioConnecting(false);

    // Clear event triggers
    if (unsubMsgRef.current) unsubMsgRef.current();
    if (unsubMembersRef.current) unsubMembersRef.current();
    if (unsubTimerRef.current) unsubTimerRef.current();

    try {
      // Send leave announcement
      await coStudyService.sendMessage({
        roomId: roomRef.$id!,
        senderId: "system",
        senderName: "Focus Bot",
        message: `🚪 ${userName} has left the study room.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });

      // Remove presence registration
      await coStudyService.leaveRoom(roomRef.$id!, userId);
      loadRooms();
    } catch (err) {
      console.error("Error leaving study room:", err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!roomId) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this study room?");
    if (!confirmDelete) return;

    try {
      if (joinedRoom && (joinedRoom.$id === roomId || (joinedRoom as any).id === roomId)) {
        await handleLeaveRoom();
      }

      await coStudyService.deleteRoom(roomId);
      toast.success("Study room deleted successfully.");
      await loadRooms();
    } catch (err: any) {
      console.error("Failed to delete study room:", err);
      toast.error(`Failed to delete room: ${err.message || err}`);
    }
  };

  // Clean up subscriptions on component unmount
  useEffect(() => {
    return () => {
      if (unsubMsgRef.current) unsubMsgRef.current();
      if (unsubMembersRef.current) unsubMembersRef.current();
      if (unsubTimerRef.current) unsubTimerRef.current();
    };
  }, []);

  // Handle Create Room Click (Subscription gating checks)
  const handleCreateRoomClick = () => {
    const isFree = !activePlan || activePlan.plan === "free";
    if (isFree) {
      setIsGatingDialogOpen(true);
    } else {
      setIsCreateDialogOpen(true);
    }
  };

  // Process Creating Room
  const handleCreateRoomConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name.");
      return;
    }

    try {
      const room = await coStudyService.createRoom({
        name: newRoomName.trim(),
        description: newRoomDesc.trim() || "Virtual room for collaborative study focus.",
        maxMembers: activePlan?.plan === "pro" ? 5 : 25,
        isPrivate: newRoomPrivate,
        creatorId: userId,
        createdAt: new Date().toISOString()
      });

      setIsCreateDialogOpen(false);
      setNewRoomName("");
      setNewRoomDesc("");
      setNewRoomPrivate(false);
      
      // Load and join room
      await loadRooms();
      await handleJoinRoom(room);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to create study room: ${err.message || err}`);
    }
  };

  // Post chat message
  const handleSendMessage = async () => {
    const messageText = typedMessage.trim();
    if (!messageText || !joinedRoom || isSendingRef.current) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const tempMsg: StudyRoomMessage = {
      $id: tempId,
      roomId: joinedRoom.$id!,
      senderId: userId,
      senderName: userName,
      message: messageText,
      timestamp: timestampStr
    };

    // Optimistically update input and chat logs
    setTypedMessage("");
    setChatLogs(prev => [...prev, tempMsg]);
    isSendingRef.current = true;

    try {
      const sentMsg = await coStudyService.sendMessage({
        roomId: joinedRoom.$id!,
        senderId: userId,
        senderName: userName,
        message: messageText,
        timestamp: timestampStr
      });

      if (sentMsg) {
        setChatLogs(prev => {
          const hasReal = prev.some(m => m.$id === sentMsg.$id);
          const tempIdx = prev.findIndex(m => m.$id === tempId);

          if (tempIdx !== -1) {
            const updated = [...prev];
            if (hasReal) {
              updated.splice(tempIdx, 1);
            } else {
              updated[tempIdx] = sentMsg;
            }
            return updated;
          }

          if (!hasReal) {
            return [...prev, sentMsg];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Message send failed:", err);
      toast.error("Failed to send message.");
      // Rollback optimistic append
      setChatLogs(prev => prev.filter(m => m.$id !== tempId));
      setTypedMessage(messageText);
    } finally {
      isSendingRef.current = false;
    }
  };

  // User posts study status tag update
  const handlePostStatusTag = async (statusTag: string) => {
    if (!joinedRoom) return;

    try {
      // Update presence status
      await coStudyService.updateMemberStatus(joinedRoom.$id!, userId, `Focusing: ${statusTag}`, true);

      // Post status text in chat logs
      await coStudyService.sendMessage({
        roomId: joinedRoom.$id!,
        senderId: "system",
        senderName: "Focus Bot",
        message: `📝 ${userName} is now focusing on: ${statusTag}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });
      toast.success(`Study status updated: ${statusTag}`);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── PAGE HEADER ─── */}
      {!joinedRoom && (
        <Card className="relative overflow-hidden border border-border/80 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-purple-500/5 dark:from-violet-950/20" />
          <CardHeader className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold px-2 py-0.5 text-xs">
                  Active Accountability Focus
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl font-black">Co-Study Focus Rooms</CardTitle>
                <CardDescription className="text-muted-foreground text-sm max-w-xl">
                  Study side-by-side with online classmates, synchronize study cycles, chat, and stream focus tunes together.
                </CardDescription>
              </div>
              <Button
                onClick={handleCreateRoomClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 cursor-pointer shadow-md shadow-indigo-500/10"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                Create Private Room
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* ─── ROOM LOBBY VIEW ─── */}
      {!joinedRoom ? (
        <>
          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-semibold">Loading focus lobbies...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 bg-card/35 backdrop-blur-md rounded-3xl border border-border/60 shadow-sm space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1 px-6">
                <h3 className="text-sm font-black text-foreground">No active focus rooms</h3>
                <p className="text-xs text-muted-foreground leading-normal">Be the first to create a custom study room and invite your study peers!</p>
              </div>
              <Button
                onClick={handleCreateRoomClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
              >
                Create Room
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card
                  key={room.$id}
                  className="bg-card/45 backdrop-blur-sm border border-border/60 hover:border-indigo-500/50 hover:shadow-[0_12px_30px_-10px_rgba(99,102,241,0.15)] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden relative"
                >
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-60" />
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0.5 tracking-wider border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                          🟢 Active Focus
                        </Badge>
                        {room.isPrivate && (
                          <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0.5 border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 gap-1">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </Badge>
                        )}
                      </div>
                      {room.creatorId === userId && room.creatorId !== "system" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room.$id || "");
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-base font-extrabold mt-3.5 text-foreground leading-snug">{room.name}</CardTitle>
                    <CardDescription className="text-xs leading-normal mt-1.5 min-h-[36px] text-muted-foreground/90">
                      {room.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{room.membersCount} online</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Timer className="w-4 h-4 text-violet-500" />
                        <span>25m Pomodoro</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoinRoom(room)}
                      className="w-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-600 hover:to-purple-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent font-black text-xs py-5 rounded-xl cursor-pointer transition-all duration-300"
                    >
                      Join Study Room
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // ─── ACTIVE STUDY ROOM VIEW ───
        <div className="space-y-6">
          {/* Room Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-card/80 to-indigo-500/5 p-5 rounded-2xl border border-border/80 shadow-md relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleLeaveRoom}
                className="rounded-xl border-border/80 h-10 w-10 cursor-pointer hover:bg-accent hover:text-foreground transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2 flex-wrap">
                  {joinedRoom.name}
                  {joinedRoom.creatorId === userId && (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 text-[9px] gap-1 border-amber-500/20">
                      <Crown className="w-3 h-3" /> Host
                    </Badge>
                  )}
                  {joinedRoom.isPrivate && (
                    <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold px-2 py-0.5 text-[9px] gap-1 border-purple-500/20">
                      <Lock className="w-3 h-3" /> Private
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{joinedRoom.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
              <Button
                onClick={() => {
                  const inviteLink = `${window.location.origin}?join=${joinedRoom.$id || (joinedRoom as any).id}`;
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("Study room invite link copied to clipboard!");
                }}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs h-9 rounded-xl gap-1.5 cursor-pointer border border-indigo-500/20 transition-all flex items-center px-4.5"
              >
                <PlusCircle className="w-4 h-4 animate-bounce" />
                Invite Friends
              </Button>
              {joinedRoom.creatorId === userId && joinedRoom.creatorId !== "system" && (
                <Button
                  onClick={() => handleDeleteRoom(joinedRoom.$id || "")}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs h-9 rounded-xl gap-1.5 cursor-pointer transition-all flex items-center px-4.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Room
                </Button>
              )}
              <Badge variant="outline" className="h-9 px-3.5 text-xs font-black bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 select-none animate-pulse">
                👥 {peers.length + 1} studying
              </Badge>
            </div>
          </div>

          {/* Mobile Tab Bar (Visible only on mobile/tablet) */}
          <div className="flex lg:hidden border border-border/60 bg-card/45 backdrop-blur-md rounded-2xl p-1 gap-1">
            <button
              onClick={() => setActiveMobileTab("focus")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                activeMobileTab === "focus"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              ⏳ Focus & Music
            </button>
            <button
              onClick={() => setActiveMobileTab("chat")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeMobileTab === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              💬 Chat & Peers
              {chatLogs.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {chatLogs.length}
                </span>
              )}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT 2 COLUMNS: Timer & Lofi tuners */}
            <div className={`lg:col-span-2 space-y-6 ${activeMobileTab === "focus" ? "block" : "hidden lg:block"}`}>
              {/* Pomodoro Timer widget */}
              <Card className="border border-border/60 overflow-hidden relative shadow-lg bg-card/65 backdrop-blur-md transition-all duration-300 hover:shadow-xl">
                <div className={`absolute top-0 inset-x-0 h-1.5 transition-all duration-500 ${timerMode === "work" ? "bg-indigo-600 animate-pulse" : "bg-emerald-500"}`} />
                <CardHeader className="text-center pb-2">
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block">
                    {timerMode === "work" ? "💻 Focus Study Session" : "☕ Recovery Break"}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
                  {/* Timer display with custom glowing dropshadow based on mode */}
                  <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter text-foreground tabular-nums select-none transition-all duration-500 filter ${
                    timerMode === "work" 
                      ? "drop-shadow-[0_0_20px_rgba(99,102,241,0.25)]" 
                      : "drop-shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  }`}>
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </div>

                  {/* Playback Controls (Host-only or synced) */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (joinedRoom.creatorId !== userId) {
                          toast.error("Only the Host can play/pause the synchronized clock.");
                          return;
                        }
                        const nextActive = !timerActive;
                        setTimerActive(nextActive);
                        sendTimerSyncSignal(nextActive ? "PLAY" : "PAUSE", minutes, seconds);
                      }}
                      className={`h-12 w-12 rounded-full cursor-pointer transition-all duration-300 transform active:scale-95 shadow-md ${
                        timerActive
                          ? "border-red-500/40 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                          : "border-indigo-500/40 text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20"
                      }`}
                    >
                      {timerActive ? <Pause className="w-5.5 h-5.5" /> : <Play className="w-5.5 h-5.5 ml-0.5" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (joinedRoom.creatorId !== userId) {
                          toast.error("Only the Host can reset the synchronized clock.");
                          return;
                        }
                        setTimerActive(false);
                        setTimerMode("work");
                        setMinutes(25);
                        setSeconds(0);
                        coStudyService.updateRoomTimer(joinedRoom.$id!, { timerMode: "work" });
                        sendTimerSyncSignal("RESET", 25, 0);
                        toast.info("Timer reset to 25m focus block.");
                      }}
                      className="h-10 w-10 rounded-full border-border/80 text-muted-foreground hover:text-foreground cursor-pointer transition-transform duration-200 active:scale-90 hover:rotate-180"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (joinedRoom.creatorId !== userId) {
                          toast.error("Only the Host can toggle/skip session modes.");
                          return;
                        }
                        setTimerActive(false);
                        const next = timerMode === "work" ? "break" : "work";
                        setTimerMode(next);
                        const nextMins = next === "work" ? 25 : 5;
                        setMinutes(nextMins);
                        setSeconds(0);
                        coStudyService.updateRoomTimer(joinedRoom.$id!, { timerMode: next });
                        sendTimerSyncSignal("SWITCH", nextMins, 0, next);
                        toast.info(`Switched to: ${next}`);
                      }}
                      className="text-xs h-10 rounded-xl border-border/80 gap-1.5 cursor-pointer hover:bg-accent transition-colors px-3.5 font-bold"
                    >
                      <Coffee className="w-4 h-4 text-amber-500" />
                      Skip Session
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Music & Radio player */}
              <Card className="border border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Tv className="w-4.5 h-4.5 text-indigo-500" />
                      Music & Radio Deck
                    </CardTitle>
                    <div className="flex items-center gap-1.5 bg-accent/40 px-2 py-1 rounded-lg border border-border/40 text-[10px] text-muted-foreground font-semibold">
                      <span>YouTube + FM Radio</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Selector tab list */}
                  <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-border/50 bg-background/55 items-center">
                    {LOFI_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          // Stop any currently playing audio element
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current = null;
                          }
                          setMusicPreset(preset);
                          setIsCustomMode(false);
                          setIsMusicPlaying(true);
                          setIsAudioPlayingState(true);
                          setIsAudioConnecting(preset.isRadio || false);
                          toast.success(`Playing ${preset.name}!`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                          !isCustomMode && musicPreset.id === preset.id
                            ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                            : "bg-accent/40 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                        }`}
                      >
                        {(preset as any).isRadio && <Radio className="w-3 h-3" />}
                        {preset.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setIsCustomMode(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        isCustomMode
                          ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                          : "bg-accent/40 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                      }`}
                    >
                      🎵 Custom Stream
                    </button>
                  </div>

                  {/* Custom URL Input Field */}
                  {isCustomMode && (
                    <div className="px-4 pt-3 pb-0">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="YouTube link/ID or Audio stream URL..."
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background/70 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-muted-foreground/60 text-foreground"
                        />
                        <Button
                          onClick={() => {
                            const videoId = getYoutubeVideoId(customUrl);
                            if (videoId) {
                              if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current = null;
                              }
                              setMusicPreset({
                                id: "custom",
                                name: "Custom Stream",
                                url: `https://www.youtube.com/embed/${videoId}?autoplay=1`
                              });
                              setIsMusicPlaying(true);
                              setIsAudioPlayingState(false);
                              toast.success("Playing custom YouTube stream!");
                            } else if (customUrl.trim().startsWith("http://") || customUrl.trim().startsWith("https://")) {
                              if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current = null;
                              }
                              setMusicPreset({
                                id: "custom",
                                name: "Custom Audio Stream",
                                url: customUrl.trim(),
                                isRadio: true
                              } as any);
                              setIsMusicPlaying(true);
                              setIsAudioPlayingState(true);
                              setIsAudioConnecting(true);
                              toast.success("Playing custom audio stream!");
                            } else {
                              toast.error("Invalid URL. Enter a YouTube URL or direct audio link.");
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shrink-0"
                        >
                          Play
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">
                        Supports YouTube links/IDs or direct audio/radio stream links (HTTP/HTTPS).
                      </p>
                    </div>
                  )}

                  <div className="p-4 space-y-4">
                    {isMusicPlaying ? (
                      (musicPreset as any).isRadio ? (
                        /* ── FM Radio Player ── */
                        <div className="w-full rounded-2xl overflow-hidden border border-border shadow-inner relative">
                          <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-6 flex flex-col items-center gap-5">
                            {/* Spinning vinyl disc */}
                            <div className="relative">
                              <div className={`w-28 h-28 rounded-full border-4 border-indigo-500/30 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)] ${
                                isAudioPlayingState && !isAudioConnecting ? "animate-spin" : ""
                              }`} style={{ animationDuration: "3s" }}>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                  <Radio className="w-5 h-5 text-white" />
                                </div>
                                {/* Vinyl grooves */}
                                <div className="absolute inset-4 rounded-full border border-white/5" />
                                <div className="absolute inset-7 rounded-full border border-white/5" />
                                <div className="absolute inset-10 rounded-full border border-white/5" />
                              </div>
                              {/* LIVE badge */}
                              {isAudioPlayingState && !isAudioConnecting && (
                                <span className="absolute -top-1 -right-1 flex items-center gap-1 bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  LIVE
                                </span>
                              )}
                              {/* CONNECTING overlay / badge */}
                              {isAudioPlayingState && isAudioConnecting && (
                                <span className="absolute -top-1 -right-1 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  CONNECTING
                                </span>
                              )}
                            </div>

                            {/* Station info */}
                            <div className="text-center">
                              <p className="text-white font-extrabold text-lg tracking-wide">{musicPreset.name}</p>
                              {isAudioConnecting ? (
                                <p className="text-amber-400 text-[10px] font-bold mt-0.5 animate-pulse flex items-center justify-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                                  Connecting Stream...
                                </p>
                              ) : (
                                <p className="text-indigo-300/70 text-[10px] font-medium mt-0.5">Sri Lanka • FM Radio • Live Stream</p>
                              )}
                            </div>

                            {/* Play / Pause */}
                            <div className="flex items-center gap-4">
                              <Button
                                onClick={() => {
                                  if (audioRef.current) {
                                    if (isAudioPlayingState) {
                                      audioRef.current.pause();
                                      setIsAudioPlayingState(false);
                                    } else {
                                      audioRef.current.play();
                                      setIsAudioPlayingState(true);
                                    }
                                  }
                                }}
                                disabled={isAudioConnecting}
                                className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center cursor-pointer transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isAudioConnecting ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : isAudioPlayingState ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5" />
                                )}
                              </Button>
                            </div>

                            {/* Volume slider */}
                            <div className="flex items-center gap-2 w-full max-w-[200px]">
                              <Volume1 className="w-4 h-4 text-indigo-300/60" />
                              <input
                                type="range"
                                min={0}
                                max={100}
                                defaultValue={80}
                                onChange={(e) => {
                                  if (audioRef.current) {
                                    audioRef.current.volume = Number(e.target.value) / 100;
                                  }
                                }}
                                className="w-full h-1 bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                              <Volume2 className="w-4 h-4 text-indigo-300/60" />
                            </div>
                          </div>

                          {/* Hidden HTML5 audio element */}
                          <audio
                            key={musicPreset.url}
                            ref={(el) => {
                              audioRef.current = el;
                              if (el) {
                                el.volume = 0.8;
                              }
                            }}
                            src={musicPreset.url}
                            onLoadStart={() => {
                              if (isAudioPlayingState) {
                                setIsAudioConnecting(true);
                              }
                            }}
                            onWaiting={() => {
                              if (isAudioPlayingState) {
                                setIsAudioConnecting(true);
                              }
                            }}
                            onPlaying={() => setIsAudioConnecting(false)}
                            onPause={() => setIsAudioConnecting(false)}
                            onEnded={() => setIsAudioConnecting(false)}
                            onError={() => {
                              setIsAudioConnecting(false);
                              toast.error("Failed to load stream. The radio station might be offline.");
                            }}
                            style={{ display: "none" }}
                          />
                        </div>
                      ) : (
                        /* ── YouTube iframe player ── */
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black shadow-inner relative">
                          <iframe
                            width="100%"
                            height="100%"
                            src={musicPreset.url}
                            title="Lofi player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center py-10 bg-accent/30 rounded-2xl border border-dashed border-border/70 space-y-3 flex flex-col items-center">
                        <Volume2 className="h-8 w-8 text-indigo-500 animate-bounce" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Need background lofi focus tunes or FM radio?</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Select a preset above or use the custom stream option.</p>
                        </div>
                        <Button
                          onClick={() => {
                            if (isCustomMode) {
                              const videoId = getYoutubeVideoId(customUrl);
                              if (videoId) {
                                if (audioRef.current) {
                                  audioRef.current.pause();
                                  audioRef.current = null;
                                }
                                setMusicPreset({
                                  id: "custom",
                                  name: "Custom Stream",
                                  url: `https://www.youtube.com/embed/${videoId}?autoplay=1`
                                });
                                setIsMusicPlaying(true);
                                setIsAudioPlayingState(false);
                                toast.success("Playing custom YouTube stream!");
                              } else if (customUrl.trim().startsWith("http://") || customUrl.trim().startsWith("https://")) {
                                if (audioRef.current) {
                                  audioRef.current.pause();
                                  audioRef.current = null;
                                }
                                setMusicPreset({
                                  id: "custom",
                                  name: "Custom Audio Stream",
                                  url: customUrl.trim(),
                                  isRadio: true
                                } as any);
                                setIsMusicPlaying(true);
                                setIsAudioPlayingState(true);
                                setIsAudioConnecting(true);
                                toast.success("Playing custom audio stream!");
                              } else {
                                toast.error("Please enter a valid YouTube URL, ID, or audio link.");
                              }
                            } else {
                              setIsMusicPlaying(true);
                              setIsAudioPlayingState(true);
                              toast.success(`Playing ${musicPreset.name}!`);
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                          Enable Focus Player
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Classmates presence listings */}
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-indigo-500" />
                    Online Peers
                  </CardTitle>
                  <CardDescription className="text-xs">Active members in this classroom</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* User Self */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-600/30 bg-indigo-500/5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                        YOU
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-foreground truncate">{userName}</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          {timerMode === "work" ? (timerActive ? "🟢 Focusing" : "🟡 Idle") : "☕ Resting"}
                        </p>
                      </div>
                    </div>

                    {/* Room Peers */}
                    {peers.map((peer) => (
                      <div key={peer.$id || peer.userId} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/55">
                        <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                          {peer.userName[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-foreground truncate">{peer.userName}</p>
                          <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-snug">
                            {peer.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Live Group Chat & Status Updates */}
            <div className={`lg:col-span-1 space-y-6 ${activeMobileTab === "chat" ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
              {/* Group chat window */}
              <Card className="border border-border/60 shadow-sm flex flex-col h-[550px]">
                <CardHeader className="border-b border-border/60 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-4.5 h-4.5 text-indigo-500" />
                    Live Room Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
                  
                  {/* Chat messages listing container */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3 scroll-smooth">
                    {chatLogs.map((log) => {
                      if (log.isSystem) {
                        return (
                          <div key={log.$id} className="text-center bg-accent/40 rounded-xl p-2 border border-border/30">
                            <p className="text-[9px] font-bold text-muted-foreground leading-normal">{log.message}</p>
                          </div>
                        );
                      }
                      
                      const isSelf = log.senderId === userId;
                      return (
                        <div key={log.$id} className={`flex items-start gap-2 max-w-[85%] ${isSelf ? "ml-auto flex-row-reverse" : ""}`}>
                          <div className={`w-6.5 h-6.5 rounded-lg shrink-0 flex items-center justify-center font-black text-[9px] select-none text-white ${isSelf ? "bg-indigo-600" : "bg-purple-600"}`}>
                            {log.senderName[0].toUpperCase()}
                          </div>
                          <div className={`rounded-2xl p-2.5 text-xs ${
                            isSelf 
                              ? "bg-indigo-600 text-white rounded-tr-none" 
                              : "bg-accent/60 text-foreground rounded-tl-none border border-border/30"
                          }`}>
                            {!isSelf && <span className="font-black block text-[8px] text-indigo-500 dark:text-indigo-400 mb-0.5">{log.senderName}</span>}
                            <p className="leading-relaxed break-words">{log.message}</p>
                            <span className={`text-[7px] text-right block mt-1.5 ${isSelf ? "text-indigo-200" : "text-muted-foreground"}`}>{log.timestamp}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Send chat input */}
                  <div className="flex items-center gap-1.5 border-t border-border/50 pt-3.5">
                    <input
                      type="text"
                      placeholder="Send message..."
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 text-xs px-3.5 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 w-10 rounded-2xl shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Update Card */}
              <Card className="border border-border/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Post Study Status Update</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "📝 Essay Drafting", tag: "Essay Drafting" },
                      { label: "💻 Coding CS Lab", tag: "Coding CS Lab" },
                      { label: "📚 Reading Material", tag: "Reading Textbook" },
                      { label: "🧮 Math Formulas", tag: "Solving Math Tasks" },
                      { label: "🧪 Physics Quiz", tag: "Solving Physics Quiz" },
                      { label: "☕ Tea break", tag: "Taking Tea Break" }
                    ].map((status) => (
                      <button
                        key={status.tag}
                        onClick={() => handlePostStatusTag(status.tag)}
                        className="p-2 bg-accent/40 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-border/30 rounded-xl text-[10px] font-bold text-muted-foreground transition-colors cursor-pointer text-center"
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIALOG: SUBSCRIPTION GATING (FREE USER LOCK) ─── */}
      <Dialog open={isGatingDialogOpen} onOpenChange={setIsGatingDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-md">
              <Crown className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">Scholar Pro Subscription Required</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[320px] mx-auto">
                Creating custom private Focus Rooms is a premium feature. Free tier members can join any public room, but require Scholar Pro or Premium to host their own.
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="p-4 rounded-2xl bg-zinc-950/20 border border-border/65 text-xs text-muted-foreground space-y-2 mt-2 leading-normal">
            <span className="font-bold text-foreground block">🔓 Pro Membership features:</span>
            <span>• Create private rooms for up to 5 study buddies.</span><br/>
            <span>• Fully unlock 500 AI study credits per month.</span><br/>
            <span>• Custom room themes & playlist streaming.</span>
          </div>

          <DialogFooter className="flex flex-row gap-3 pt-3.5">
            <Button
              variant="ghost"
              onClick={() => setIsGatingDialogOpen(false)}
              className="flex-1 text-xs rounded-2xl py-5"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsGatingDialogOpen(false);
                if (onNavigateToBilling) {
                  onNavigateToBilling();
                } else {
                  window.dispatchEvent(new CustomEvent("navigateToStudyPage", { detail: "billing" }));
                }
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl py-5 shadow-lg shadow-indigo-500/10"
            >
              View Pricing Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: CREATE ROOM (PRO / PREMIUM ONLY) ─── */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleCreateRoomConfirm} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                Create Custom Study Room
              </DialogTitle>
              <DialogDescription className="text-xs">Set up a synchronized workspace for your group study sessions.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bio 101 Midterm Group, Coding & Chill"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Short Description</label>
                <textarea
                  placeholder="e.g. Focus sessions with 25m work / 5m breaks. Study music embed."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium resize-none"
                />
              </div>

              {/* Private Checkbox */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-border/55 bg-background/55">
                <div>
                  <span className="text-xs font-bold text-foreground block">Make Room Private</span>
                  <span className="text-[10px] text-muted-foreground">Only friends with the invite link can view and join.</span>
                </div>
                <input
                  type="checkbox"
                  checked={newRoomPrivate}
                  onChange={(e) => setNewRoomPrivate(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1 text-xs rounded-2xl py-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl py-5 shadow-lg shadow-indigo-500/10"
              >
                Create and Launch Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
