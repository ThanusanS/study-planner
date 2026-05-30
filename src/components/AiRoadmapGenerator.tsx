import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Textarea } from "../app/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../app/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../app/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../app/components/ui/alert-dialog";
import {
  Loader2,
  Map,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  Zap,
  BookOpen,
  Eye,
  Target,
  Route,
  Flag,
} from "lucide-react";
import {
  generateQuickRoadmap,
  generateDetailedRoadmap,
} from "../services/aiRoadmapService";
import databaseService, { RoadmapHistory } from "../services/databaseService";
import planService, { UserPlan } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const AiRoadmapGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);

  const [mode, setMode] = useState("quick");
  const [goal, setGoal] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapHistory[]>([]);
  const [roadmapsLoading, setRoadmapsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editRoadmapType, setEditRoadmapType] = useState<"quick" | "detailed">(
    "quick"
  );
  const [editRoadmapContent, setEditRoadmapContent] = useState("");
  const [roadmapPendingDelete, setRoadmapPendingDelete] =
    useState<RoadmapHistory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (resolvedUserId) {
      loadRoadmaps();
      planService.getUserPlan(resolvedUserId).then(setActivePlan);
    }

    const handlePlanChange = (e: any) => {
      setActivePlan(e.detail);
    };

    window.addEventListener("studyPlanChanged", handlePlanChange);
    return () => {
      window.removeEventListener("studyPlanChanged", handlePlanChange);
    };
  }, [user]);

  const loadRoadmaps = async () => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId) return;
    setRoadmapsLoading(true);
    try {
      const userRoadmaps = await databaseService.getRoadmaps(resolvedUserId);
      setRoadmaps(userRoadmaps);
    } catch (err) {
      console.error("Failed to load roadmap history:", err);
    } finally {
      setRoadmapsLoading(false);
    }
  };

  const saveRoadmap = async (roadmapContent?: string) => {
    const contentToSave = roadmapContent || result;
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId || !contentToSave) return;

    try {
      const newRoadmap: Omit<RoadmapHistory, "$id"> = {
        userId: resolvedUserId,
        goal: goal.trim(),
        subject: subject.trim() || undefined,
        duration: duration.trim() || undefined,
        level: level.trim() || undefined,
        roadmapType: mode as "quick" | "detailed",
        roadmapContent: contentToSave,
        createdAt: new Date().toISOString(),
      };

      await databaseService.createRoadmap(newRoadmap);
      toast.success("Roadmap saved to history!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadRoadmaps();
    } catch (err) {
      console.error("Save roadmap error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to save roadmap.";
      toast.error(message);
      setError(message);
    }
  };

  const requestDeleteRoadmap = (roadmap: RoadmapHistory) => {
    setRoadmapPendingDelete(roadmap);
  };

  const undoDeleteRoadmap = async (roadmap: RoadmapHistory) => {
    try {
      const restoredRoadmap: Omit<RoadmapHistory, "$id"> = {
        userId: roadmap.userId,
        goal: roadmap.goal,
        subject: roadmap.subject,
        duration: roadmap.duration,
        level: roadmap.level,
        roadmapType: roadmap.roadmapType,
        roadmapContent: roadmap.roadmapContent,
        createdAt: roadmap.createdAt,
      };
      await databaseService.createRoadmap(restoredRoadmap);
      await loadRoadmaps();
      toast.success("Roadmap restored to history");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore roadmap."
      );
    }
  };

  const confirmDeleteRoadmap = async () => {
    if (!roadmapPendingDelete?.$id) return;

    const deletedRoadmap = roadmapPendingDelete;
    setDeleteLoading(true);
    setRoadmapPendingDelete(null);

    try {
      setRoadmaps((prev) =>
        prev.filter((r) => r.$id !== deletedRoadmap.$id)
      );
      if (editingRoadmapId === deletedRoadmap.$id) {
        cancelEditRoadmap();
      }
      if (expandedRoadmapId === deletedRoadmap.$id) {
        setExpandedRoadmapId(null);
      }
      await databaseService.deleteRoadmap(deletedRoadmap.$id);
      toast.success("Roadmap deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void undoDeleteRoadmap(deletedRoadmap);
          },
        },
      });
    } catch (err) {
      await loadRoadmaps();
      setError(
        err instanceof Error ? err.message : "Failed to delete roadmap."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEditRoadmap = (roadmap: RoadmapHistory) => {
    if (!roadmap.$id) return;
    setEditingRoadmapId(roadmap.$id);
    setEditGoal(roadmap.goal);
    setEditSubject(roadmap.subject || "");
    setEditDuration(roadmap.duration || "");
    setEditLevel(roadmap.level || "");
    setEditRoadmapType(roadmap.roadmapType);
    setEditRoadmapContent(roadmap.roadmapContent);
  };

  const cancelEditRoadmap = () => {
    setEditingRoadmapId(null);
    setEditGoal("");
    setEditSubject("");
    setEditDuration("");
    setEditLevel("");
    setEditRoadmapType("quick");
    setEditRoadmapContent("");
  };

  const updateRoadmapHistory = async () => {
    if (!editingRoadmapId) return;
    if (!editGoal.trim() || !editRoadmapContent.trim()) {
      setError("Goal and roadmap content are required to update.");
      return;
    }

    try {
      await databaseService.updateRoadmap(editingRoadmapId, {
        goal: editGoal.trim(),
        subject: editSubject.trim() || undefined,
        duration: editDuration.trim() || undefined,
        level: editLevel.trim() || undefined,
        roadmapType: editRoadmapType,
        roadmapContent: editRoadmapContent.trim(),
      });
      cancelEditRoadmap();
      await loadRoadmaps();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update roadmap."
      );
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    if (!goal.trim()) {
      setError("Please enter a goal or topic for roadmap generation.");
      return;
    }

    const resolvedUserId =
      user?.$id || (user as any)?.id || user?.id || "test-user";
    const userPlan = await planService.getUserPlan(resolvedUserId);

    const creditsNeeded = mode === "quick" ? 1 : 2;

    if (userPlan.aiCredits < creditsNeeded) {
      setError(
        `Insufficient AI Credits. ${mode === "quick" ? "Quick Roadmap requires 1 credit" : "Detailed Roadmap requires 2 credits"}, but you only have ${userPlan.aiCredits} remaining. Please navigate to 'Billing & Plans' to upgrade or refill.`
      );
      toast.error("Insufficient AI Credits!");
      return;
    }

    setLoading(true);
    try {
      const input = {
        goal: goal.trim(),
        subject: subject.trim() || undefined,
        duration: duration.trim() || undefined,
        level: level.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
      };

      const output =
        mode === "quick"
          ? await generateQuickRoadmap(input)
          : await generateDetailedRoadmap(input);

      const roadmapOutput = output || "No response returned from the model.";
      setResult(roadmapOutput);

      if (roadmapOutput !== "No response returned from the model.") {
        await planService.deductCredits(
          resolvedUserId,
          `AI Roadmap (${mode === "quick" ? "Quick" : "Detailed"}) - Goal: ${goal.trim()}`,
          creditsNeeded
        );

        if (resolvedUserId) {
          try {
            await saveRoadmap(roadmapOutput);
            toast.success(
              `${mode === "quick" ? "Quick" : "Detailed"} roadmap generated and saved! (${creditsNeeded} AI Credit${creditsNeeded > 1 ? "s" : ""} deducted)`
            );
          } catch {
            console.warn("Auto-save failed, roadmap can be saved manually.");
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate roadmap."
      );
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════
  // PDF DOWNLOAD — Beautiful styled roadmap PDF
  // ══════════════════════════════════════════════
  const downloadPDF = () => {
    if (!result) return;

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginL = 18;
      const marginR = 18;
      const contentW = pageW - marginL - marginR;
      const isQuick = mode === "quick";
      const title = isQuick ? "Quick Study Roadmap" : "Detailed Study Roadmap";
      let y = 0;

      // ── Color palette ──
      const orange = { r: 234, g: 88, b: 12 };
      const darkOrange = { r: 194, g: 65, b: 12 };
      const blue = { r: 37, g: 99, b: 235 };
      const darkBlue = { r: 30, g: 58, b: 138 };
      const emerald = { r: 5, g: 150, b: 105 };
      const gray50 = { r: 249, g: 250, b: 251 };
      const gray100 = { r: 243, g: 244, b: 246 };
      const gray300 = { r: 209, g: 213, b: 219 };
      const gray500 = { r: 107, g: 114, b: 128 };
      const gray700 = { r: 55, g: 65, b: 81 };
      const gray900 = { r: 17, g: 24, b: 39 };
      const orangeBg = { r: 255, g: 247, b: 237 };
      const blueBg = { r: 239, g: 246, b: 255 };
      const greenBg = { r: 240, g: 253, b: 244 };
      const amber700 = { r: 180, g: 83, b: 9 };

      const primary = isQuick ? orange : blue;
      const primaryDark = isQuick ? darkOrange : darkBlue;
      const primaryBg = isQuick ? orangeBg : blueBg;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 22) {
          doc.addPage();
          y = 20;
        }
      };

      const drawHeader = (isFirst: boolean) => {
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.rect(0, 0, pageW, isFirst ? 42 : 12, "F");
        doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.rect(0, 0, pageW, 3.5, "F");

        if (isFirst) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(21);
          doc.setTextColor(255, 255, 255);
          doc.text("AI Roadmap Generator", marginL, 18);

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          const badgeText = `  ${title}  `;
          const badgeW = doc.getTextWidth(badgeText) + 4;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginL, 23, badgeW, 6.5, 1.5, 1.5, "F");
          doc.setTextColor(primary.r, primary.g, primary.b);
          doc.text(badgeText.trim(), marginL + 2, 27.2);

          doc.setTextColor(220, 240, 255);
          doc.setFontSize(8);
          doc.text(
            new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            pageW - marginR,
            15,
            { align: "right" }
          );
          doc.text(
            new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            pageW - marginR,
            20,
            { align: "right" }
          );

          y = 48;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const goalLabel = goal.trim() || "Study Roadmap";
          const goalLines = doc.splitTextToSize(goalLabel, contentW);
          doc.text(goalLines, marginL, y);
          y += goalLines.length * 5 + 2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const badges = [
            `Type: ${isQuick ? "Quick Roadmap" : "Detailed Roadmap"}`,
            ...(level.trim() ? [`Level: ${level.trim()}`] : []),
            ...(duration.trim() ? [`Duration: ${duration.trim()}`] : []),
            ...(subject.trim() ? [`Subject: ${subject.trim()}`] : []),
          ];
          let badgeX = marginL;
          for (const badge of badges) {
            const bw = doc.getTextWidth(badge) + 6;
            doc.setFillColor(gray50.r, gray50.g, gray50.b);
            doc.setDrawColor(gray300.r, gray300.g, gray300.b);
            doc.roundedRect(badgeX, y - 3.5, bw, 5.5, 1, 1, "FD");
            doc.setTextColor(gray700.r, gray700.g, gray700.b);
            doc.text(badge, badgeX + 3, y);
            badgeX += bw + 3;
          }
          y += 8;

          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, pageW - marginR, y);
          y += 7;
        } else {
          y = 18;
        }
      };

      const drawFooters = () => {
        const total = doc.getNumberOfPages();
        for (let p = 1; p <= total; p++) {
          doc.setPage(p);
          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.2);
          doc.line(marginL, pageH - 14, pageW - marginR, pageH - 14);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(gray500.r, gray500.g, gray500.b);
          doc.text(
            "Generated by AI Roadmap Generator — Study Planner",
            marginL,
            pageH - 9
          );
          doc.text(`Page ${p} of ${total}`, pageW - marginR, pageH - 9, {
            align: "right",
          });
        }
      };

      drawHeader(true);

      const lines = result.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3;
          continue;
        }

        // --- SECTION HEADINGS ---
        if (
          /^(ROADMAP TITLE:|TOTAL DURATION:|DIFFICULTY LEVEL:|PREREQUISITES:|OVERVIEW:|FINAL GOAL:|FINAL PROJECT|RESOURCES:|SUCCESS CRITERIA:|TIPS:|CHECKPOINT:)/i.test(
            trimmed
          )
        ) {
          ensureSpace(14);
          if (y > 55) y += 4;

          const hLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = hLines.length * 5 + 5;
          doc.setFillColor(primaryBg.r, primaryBg.g, primaryBg.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          doc.setFillColor(primary.r, primary.g, primary.b);
          doc.roundedRect(marginL, y - 4, 1.5, blockH, 0.7, 0.7, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text(hLines, marginL + 6, y + 1);
          y += blockH + 3;
          continue;
        }

        // --- PHASE / WEEK headers ---
        if (/^(PHASE \d+|WEEK \d+):/i.test(trimmed)) {
          ensureSpace(14);
          y += 3;

          const hLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = hLines.length * 5 + 5;
          doc.setFillColor(greenBg.r, greenBg.g, greenBg.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          doc.setFillColor(emerald.r, emerald.g, emerald.b);
          doc.roundedRect(marginL, y - 4, 1.5, blockH, 0.7, 0.7, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(emerald.r, emerald.g, emerald.b);
          doc.text(hLines, marginL + 6, y + 1);
          y += blockH + 3;
          continue;
        }

        // --- MILESTONE lines ---
        if (/^MILESTONE:/i.test(trimmed)) {
          ensureSpace(10);
          y += 1;

          const mLines = doc.splitTextToSize(trimmed, contentW - 14);
          const blockH = mLines.length * 5 + 4;
          doc.setFillColor(255, 251, 235);
          doc.roundedRect(
            marginL + 4,
            y - 3.5,
            contentW - 8,
            blockH,
            1,
            1,
            "F"
          );

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(amber700.r, amber700.g, amber700.b);
          doc.text(mLines, marginL + 7, y);
          y += blockH + 2;
          continue;
        }

        // --- Day headers (Day 1-2:, Day 3-4:) ---
        if (/^\s*Day\s+\d/i.test(trimmed)) {
          ensureSpace(10);
          y += 2;

          const numLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = numLines.length * 5 + 4;
          doc.setFillColor(gray100.r, gray100.g, gray100.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          doc.setFillColor(primary.r, primary.g, primary.b);
          doc.roundedRect(marginL, y - 4, 1.2, blockH, 0.6, 0.6, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          doc.text(numLines, marginL + 5, y);
          y += blockH + 2;
          continue;
        }

        // --- Bullet points ---
        if (/^[-•]\s/.test(trimmed)) {
          ensureSpace(7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(gray700.r, gray700.g, gray700.b);
          doc.setFillColor(primary.r, primary.g, primary.b);
          doc.circle(marginL + 5, y - 1, 1, "F");
          const bLines = doc.splitTextToSize(
            trimmed.replace(/^[-•]\s*/, ""),
            contentW - 14
          );
          doc.text(bLines, marginL + 9, y);
          y += bLines.length * 4.5 + 2;
          continue;
        }

        // --- Default text ---
        ensureSpace(7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(gray700.r, gray700.g, gray700.b);
        const wrapped = doc.splitTextToSize(trimmed, contentW - 4);
        doc.text(wrapped, marginL + 2, y);
        y += wrapped.length * 4.5 + 1.5;
      }

      const total = doc.getNumberOfPages();
      for (let p = 2; p <= total; p++) {
        doc.setPage(p);
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.rect(0, 0, pageW, 12, "F");
        doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.rect(0, 0, pageW, 2.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`AI Roadmap Generator  —  ${title}`, marginL, 8);
      }

      drawFooters();

      doc.save(
        `roadmap-${mode}-${goal.trim().replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header Card */}
      <Card className="relative overflow-hidden border border-border/60 mx-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f9731620,transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent" />
        <CardHeader className="relative space-y-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                AI Roadmap Generator
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Create structured learning roadmaps — quick overview or
                detailed week-by-week study plans.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <Zap className="h-3 w-3 text-orange-500" />
              Quick Roadmap
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <Route className="h-3 w-3 text-blue-500" />
              Detailed Roadmap
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <Flag className="h-3 w-3 text-emerald-500" />
              Milestones
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400 font-bold px-2 py-0.5 sm:px-3 sm:py-1">
              ⚡{" "}
              {activePlan !== null
                ? `${activePlan.aiCredits} AI Credits`
                : "AI Credits Balance"}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={mode} onValueChange={setMode} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="quick" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Quick Roadmap
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-1.5">
            <Route className="h-3.5 w-3.5" />
            Detailed Roadmap
          </TabsTrigger>
        </TabsList>

        {/* ─── QUICK ROADMAP TAB ─── */}
        <TabsContent value="quick">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Quick Roadmap (Overview Plan)</CardTitle>
                <CardDescription>
                  Get a concise phase-based study plan with milestones and
                  estimated timelines. Great for planning at a glance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Learning Goal / Topic *
                    </label>
                    <Input
                      placeholder="e.g., Learn React.js, Master Calculus, Prepare for SAT"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject Area (optional)
                    </label>
                    <Input
                      placeholder="e.g., Computer Science, Mathematics, Physics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Duration (optional)
                    </label>
                    <Input
                      placeholder="e.g., 4 weeks, 3 months, 1 semester"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Level</label>
                    <div className="flex flex-wrap gap-2">
                      {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                        <Button
                          key={lvl}
                          type="button"
                          variant={level === lvl ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLevel(lvl)}
                        >
                          {lvl}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional context (optional)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g., I have 2 hours/day, Focus on exam prep, Include project work..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Generate Quick Roadmap
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Costs 1 AI Credit per generation
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">What you'll get</CardTitle>
                <CardDescription>
                  A high-level plan to kickstart your learning.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>🎯 Clear phases with estimated durations</p>
                <p>📍 Milestones to track your progress</p>
                <p>📋 Key action items per phase</p>
                <p>🏁 Final goal definition</p>
                <p>💡 Pro tips for effective learning</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── DETAILED ROADMAP TAB ─── */}
        <TabsContent value="detailed">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Detailed Roadmap (Comprehensive Plan)</CardTitle>
                <CardDescription>
                  Get a week-by-week or day-by-day study plan with specific
                  topics, resources, exercises, and checkpoints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Learning Goal / Topic *
                    </label>
                    <Input
                      placeholder="e.g., Learn React.js, Master Calculus, Prepare for SAT"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject Area (optional)
                    </label>
                    <Input
                      placeholder="e.g., Computer Science, Mathematics, Physics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Duration (optional)
                    </label>
                    <Input
                      placeholder="e.g., 4 weeks, 3 months, 1 semester"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Level</label>
                    <div className="flex flex-wrap gap-2">
                      {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                        <Button
                          key={lvl}
                          type="button"
                          variant={level === lvl ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLevel(lvl)}
                        >
                          {lvl}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional context (optional)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g., Include practical projects, Focus on interview prep, Use free resources only..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Route className="mr-2 h-4 w-4" />
                    )}
                    Generate Detailed Roadmap
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Costs 2 AI Credits per generation
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">What you'll get</CardTitle>
                <CardDescription>
                  A comprehensive plan for thorough learning.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>📅 Day-by-day or week-by-week schedule</p>
                <p>📚 Specific topics and subtopics breakdown</p>
                <p>🔗 Resource and textbook references</p>
                <p>✏️ Practice exercises and assignments</p>
                <p>✅ Progress checkpoints with self-assessment</p>
                <p>🎓 Final project or exam prep strategy</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action needed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Save Success */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40">
          <AlertTitle className="text-green-800 dark:text-green-300">
            Success
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Roadmap saved successfully to your history!
          </AlertDescription>
        </Alert>
      )}

      {/* AI Output */}
      {result && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 px-4 py-4 sm:px-6">
            <div>
              <CardTitle className="text-lg sm:text-2xl">
                {mode === "quick"
                  ? "🗺️ Quick Study Roadmap"
                  : "📋 Detailed Study Roadmap"}
              </CardTitle>
              <CardDescription className="mt-1">
                {goal.trim()} {subject.trim() ? `— ${subject.trim()}` : ""}
                {level.trim() ? ` • ${level.trim()}` : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {user && (
                <Button
                  onClick={() => saveRoadmap()}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Map className="w-4 h-4" />
                  Save Roadmap
                </Button>
              )}
              <Button
                onClick={downloadPDF}
                variant="outline"
                size="sm"
                disabled={!result}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-muted/40 rounded-lg p-3 sm:p-6 space-y-0">
            <div className="space-y-0 leading-7 sm:leading-8 text-sm sm:text-base font-sans">
              {result.split("\n").map((line, idx) => {
                const trimmedLine = line.trim();
                const isSectionHeading =
                  /^(ROADMAP TITLE:|TOTAL DURATION:|DIFFICULTY LEVEL:|PREREQUISITES:|OVERVIEW:|FINAL GOAL:|FINAL PROJECT|RESOURCES:|SUCCESS CRITERIA:|TIPS:|CHECKPOINT:)/i.test(
                    trimmedLine
                  );
                const isPhaseWeek =
                  /^(PHASE \d+|WEEK \d+):/i.test(trimmedLine);
                const isMilestone = /^MILESTONE:/i.test(trimmedLine);
                const isDayHeader = /^\s*Day\s+\d/i.test(trimmedLine);

                return (
                  <div
                    key={idx}
                    className={`min-h-7 sm:min-h-8 py-0.5 sm:py-1 px-2 sm:px-4 hover:bg-primary/5 transition-colors rounded ${
                      /^[-•]\s/.test(trimmedLine) ? "pl-4 sm:pl-6" : ""
                    }`}
                  >
                    <div
                      className={`${
                        isSectionHeading
                          ? "font-bold text-orange-600 dark:text-orange-400 text-base sm:text-lg mt-2"
                          : isPhaseWeek
                            ? "font-bold text-emerald-600 dark:text-emerald-400 text-base sm:text-lg mt-3"
                            : isMilestone
                              ? "font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-0.5 inline-block"
                              : isDayHeader
                                ? "font-semibold text-foreground"
                                : "text-foreground"
                      }`}
                    >
                      {line || "\u00A0"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roadmap History */}
      {user && roadmaps.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">
              Roadmap History
            </CardTitle>
            <CardDescription>
              Your saved roadmaps — view, edit, or download anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roadmapsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {roadmaps.map((roadmap) => (
                  <div
                    key={roadmap.$id}
                    className="p-3 sm:p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {editingRoadmapId === roadmap.$id ? (
                      /* ── Edit Mode ── */
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Goal
                            </label>
                            <Input
                              value={editGoal}
                              onChange={(e) => setEditGoal(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Subject
                            </label>
                            <Input
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Duration
                            </label>
                            <Input
                              value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Roadmap type
                            </label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  editRoadmapType === "quick"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditRoadmapType("quick")}
                              >
                                Quick
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  editRoadmapType === "detailed"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditRoadmapType("detailed")}
                              >
                                Detailed
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Roadmap content
                          </label>
                          <Textarea
                            rows={6}
                            value={editRoadmapContent}
                            onChange={(e) =>
                              setEditRoadmapContent(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={updateRoadmapHistory}
                            size="sm"
                            className="gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Update
                          </Button>
                          <Button
                            onClick={cancelEditRoadmap}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {roadmap.goal}
                            </h3>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                                  roadmap.roadmapType === "quick"
                                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {roadmap.roadmapType === "quick" ? (
                                  <Zap className="h-3 w-3" />
                                ) : (
                                  <Route className="h-3 w-3" />
                                )}
                                {roadmap.roadmapType === "quick"
                                  ? "Quick"
                                  : "Detailed"}
                              </span>
                              {roadmap.subject && (
                                <span>{roadmap.subject}</span>
                              )}
                              {roadmap.level && (
                                <span>Level: {roadmap.level}</span>
                              )}
                              {roadmap.duration && (
                                <span>{roadmap.duration}</span>
                              )}
                              <span>
                                {new Date(
                                  roadmap.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Button
                              onClick={() =>
                                setExpandedRoadmapId(
                                  expandedRoadmapId === roadmap.$id
                                    ? null
                                    : roadmap.$id || null
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              {expandedRoadmapId === roadmap.$id
                                ? "Collapse"
                                : "View"}
                            </Button>
                            <Button
                              onClick={() => startEditRoadmap(roadmap)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => requestDeleteRoadmap(roadmap)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Expandable roadmap content */}
                        {expandedRoadmapId === roadmap.$id && (
                          <div className="mt-4 p-3 sm:p-4 rounded-lg bg-muted/40 border border-border/40">
                            <div className="space-y-0 leading-7 text-sm font-sans max-h-96 overflow-y-auto">
                              {roadmap.roadmapContent
                                .split("\n")
                                .map((line, idx) => {
                                  const t = line.trim();
                                  const isSH =
                                    /^(ROADMAP TITLE:|TOTAL DURATION:|DIFFICULTY LEVEL:|PREREQUISITES:|OVERVIEW:|FINAL GOAL:|FINAL PROJECT|RESOURCES:|SUCCESS CRITERIA:|TIPS:|CHECKPOINT:)/i.test(
                                      t
                                    );
                                  const isPW =
                                    /^(PHASE \d+|WEEK \d+):/i.test(t);
                                  return (
                                    <div
                                      key={idx}
                                      className="min-h-6 py-0.5 px-2"
                                    >
                                      <div
                                        className={
                                          isSH
                                            ? "font-bold text-orange-600 dark:text-orange-400"
                                            : isPW
                                              ? "font-bold text-emerald-600 dark:text-emerald-400"
                                              : "text-foreground"
                                        }
                                      >
                                        {line || "\u00A0"}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(roadmapPendingDelete)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteLoading) {
            setRoadmapPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this saved roadmap?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove
              {roadmapPendingDelete
                ? ` "${roadmapPendingDelete.goal}"`
                : " this roadmap"}{" "}
              from history. You can still undo right after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteRoadmap();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
