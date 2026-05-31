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
  GraduationCap,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  Lightbulb,
  Brain,
  HelpCircle,
  Eye,
} from "lucide-react";
import {
  generateSimpleExplain,
  generateDeepExplain,
  solveDoubt,
} from "../services/aiTutorService";
import databaseService, { TutorHistory } from "../services/databaseService";
import planService, { UserPlan } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const AiTutorExplain: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);

  const [mode, setMode] = useState("simple");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [additionalContext, setAdditionalContext] = useState("");
  // Doubt solver fields
  const [doubt, setDoubt] = useState("");
  const [originalTopic, setOriginalTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<TutorHistory[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editExplainType, setEditExplainType] = useState<
    "simple" | "deep" | "doubt"
  >("simple");
  const [editTutorContent, setEditTutorContent] = useState("");
  const [entryPendingDelete, setEntryPendingDelete] =
    useState<TutorHistory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (resolvedUserId) {
      loadEntries();
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

  const loadEntries = async () => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId) return;
    setEntriesLoading(true);
    try {
      const userEntries = await databaseService.getTutorEntries(resolvedUserId);
      setEntries(userEntries);
    } catch (err) {
      console.error("Failed to load tutor history:", err);
    } finally {
      setEntriesLoading(false);
    }
  };

  const saveEntry = async (content?: string) => {
    const contentToSave = content || result;
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId || !contentToSave) return;

    try {
      const newEntry: Omit<TutorHistory, "$id"> = {
        userId: resolvedUserId,
        topic: mode === "doubt" ? doubt.trim() : topic.trim(),
        subject: subject.trim() || undefined,
        level: level.trim() || undefined,
        explainType: mode as "simple" | "deep" | "doubt",
        tutorContent: contentToSave,
        createdAt: new Date().toISOString(),
      };

      await databaseService.createTutorEntry(newEntry);
      toast.success("Explanation saved to history!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadEntries();
    } catch (err) {
      console.error("Save entry error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to save explanation.";
      toast.error(message);
      setError(message);
    }
  };

  const requestDeleteEntry = (entry: TutorHistory) => {
    setEntryPendingDelete(entry);
  };

  const undoDeleteEntry = async (entry: TutorHistory) => {
    try {
      const restored: Omit<TutorHistory, "$id"> = {
        userId: entry.userId,
        topic: entry.topic,
        subject: entry.subject,
        level: entry.level,
        explainType: entry.explainType,
        tutorContent: entry.tutorContent,
        createdAt: entry.createdAt,
      };
      await databaseService.createTutorEntry(restored);
      await loadEntries();
      toast.success("Explanation restored to history");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore entry."
      );
    }
  };

  const confirmDeleteEntry = async () => {
    if (!entryPendingDelete?.$id) return;
    const deleted = entryPendingDelete;
    setDeleteLoading(true);
    setEntryPendingDelete(null);

    try {
      setEntries((prev) => prev.filter((e) => e.$id !== deleted.$id));
      if (editingEntryId === deleted.$id) cancelEditEntry();
      if (expandedEntryId === deleted.$id) setExpandedEntryId(null);
      await databaseService.deleteTutorEntry(deleted.$id);
      toast.success("Explanation deleted", {
        action: {
          label: "Undo",
          onClick: () => void undoDeleteEntry(deleted),
        },
      });
    } catch (err) {
      await loadEntries();
      setError(err instanceof Error ? err.message : "Failed to delete entry.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEditEntry = (entry: TutorHistory) => {
    if (!entry.$id) return;
    setEditingEntryId(entry.$id);
    setEditTopic(entry.topic);
    setEditSubject(entry.subject || "");
    setEditLevel(entry.level || "");
    setEditExplainType(entry.explainType);
    setEditTutorContent(entry.tutorContent);
  };

  const cancelEditEntry = () => {
    setEditingEntryId(null);
    setEditTopic("");
    setEditSubject("");
    setEditLevel("");
    setEditExplainType("simple");
    setEditTutorContent("");
  };

  const updateEntryHistory = async () => {
    if (!editingEntryId) return;
    if (!editTopic.trim() || !editTutorContent.trim()) {
      setError("Topic and content are required to update.");
      return;
    }
    try {
      await databaseService.updateTutorEntry(editingEntryId, {
        topic: editTopic.trim(),
        subject: editSubject.trim() || undefined,
        level: editLevel.trim() || undefined,
        explainType: editExplainType,
        tutorContent: editTutorContent.trim(),
      });
      cancelEditEntry();
      await loadEntries();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry.");
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    if (mode === "doubt" && !doubt.trim()) {
      setError("Please enter your doubt or question.");
      return;
    }
    if (mode !== "doubt" && !topic.trim()) {
      setError("Please enter a topic to explain.");
      return;
    }

    const resolvedUserId =
      user?.$id || (user as any)?.id || user?.id || "test-user";
    const userPlan = await planService.getUserPlan(resolvedUserId);
    const creditsNeeded = mode === "simple" ? 1 : mode === "deep" ? 2 : 1;

    if (userPlan.aiCredits < creditsNeeded) {
      setError(
        `Insufficient AI Credits. This requires ${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""}, but you only have ${userPlan.aiCredits} remaining. Navigate to 'Billing & Plans' to upgrade.`
      );
      toast.error("Insufficient AI Credits!");
      return;
    }

    setLoading(true);
    try {
      let output: string;
      if (mode === "simple") {
        output =
          (await generateSimpleExplain({
            topic: topic.trim(),
            subject: subject.trim() || undefined,
            level: level.trim() || undefined,
            additionalContext: additionalContext.trim() || undefined,
          })) || "No response returned from the model.";
      } else if (mode === "deep") {
        output =
          (await generateDeepExplain({
            topic: topic.trim(),
            subject: subject.trim() || undefined,
            level: level.trim() || undefined,
            additionalContext: additionalContext.trim() || undefined,
          })) || "No response returned from the model.";
      } else {
        output =
          (await solveDoubt({
            doubt: doubt.trim(),
            originalTopic: originalTopic.trim() || undefined,
            additionalContext: additionalContext.trim() || undefined,
          })) || "No response returned from the model.";
      }

      setResult(output);

      if (output !== "No response returned from the model.") {
        const modeLabel =
          mode === "simple"
            ? "Simple"
            : mode === "deep"
              ? "Deep"
              : "Doubt";
        const topicLabel = mode === "doubt" ? doubt.trim() : topic.trim();
        await planService.deductCredits(
          resolvedUserId,
          `AI Tutor (${modeLabel}) - ${topicLabel}`,
          creditsNeeded
        );

        if (resolvedUserId) {
          try {
            await saveEntry(output);
            toast.success(
              `${modeLabel} explanation generated and saved! (${creditsNeeded} AI Credit${creditsNeeded > 1 ? "s" : ""} deducted)`
            );
          } catch {
            console.warn("Auto-save failed.");
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate explanation."
      );
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════
  // PDF DOWNLOAD
  // ══════════════════════════════════════════════
  const downloadPDF = (entry?: TutorHistory) => {
    const isEntryObj = entry && typeof entry === "object" && "tutorContent" in entry;
    const actualEntry = isEntryObj ? entry : undefined;
    const content = actualEntry ? actualEntry.tutorContent : result;
    if (!content) return;
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginL = 18;
      const marginR = 18;
      const contentW = pageW - marginL - marginR;
      
      const rTopic = actualEntry ? actualEntry.topic : topic;
      const rSubject = actualEntry ? (actualEntry.subject || "") : subject;
      const rLevel = actualEntry ? (actualEntry.level || "") : level;
      const rType = actualEntry ? actualEntry.explainType : (mode as "simple" | "deep" | "doubt");

      const modeLabels: Record<string, string> = {
        simple: "Simple Explanation",
        deep: "Deep Explanation",
        doubt: "Doubt Solved",
      };
      const title = modeLabels[rType] || "AI Tutor";
      let y = 0;

      // Colors
      const rose = { r: 225, g: 29, b: 72 };
      const darkRose = { r: 159, g: 18, b: 57 };
      const indigo = { r: 99, g: 102, b: 241 };
      const darkIndigo = { r: 67, g: 56, b: 202 };
      const amber = { r: 217, g: 119, b: 6 };
      const emerald = { r: 5, g: 150, b: 105 };
      const gray50 = { r: 249, g: 250, b: 251 };
      const gray100 = { r: 243, g: 244, b: 246 };
      const gray300 = { r: 209, g: 213, b: 219 };
      const gray500 = { r: 107, g: 114, b: 128 };
      const gray700 = { r: 55, g: 65, b: 81 };
      const gray900 = { r: 17, g: 24, b: 39 };
      const roseBg = { r: 255, g: 241, b: 242 };
      const indigoBg = { r: 238, g: 242, b: 255 };
      const amberBg = { r: 255, g: 251, b: 235 };
      const greenBg = { r: 240, g: 253, b: 244 };

      const primary = rType === "deep" ? indigo : rose;
      const primaryDark = rType === "deep" ? darkIndigo : darkRose;
      const primaryBg = rType === "deep" ? indigoBg : roseBg;

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
          doc.text("AI Tutor — Explain Mode", marginL, 18);

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
          
          const createdDate = actualEntry ? new Date(actualEntry.createdAt) : new Date();
          doc.text(
            createdDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            pageW - marginR,
            15,
            { align: "right" }
          );

          y = 48;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const topicLabel =
            rType === "doubt" ? rTopic.trim() : rTopic.trim() || "General";
          const topicLines = doc.splitTextToSize(topicLabel, contentW);
          doc.text(topicLines, marginL, y);
          y += topicLines.length * 5 + 2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const badges = [
            `Mode: ${title}`,
            ...(rLevel.trim() ? [`Level: ${rLevel.trim()}`] : []),
            ...(rSubject.trim() ? [`Subject: ${rSubject.trim()}`] : []),
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
            "Generated by AI Tutor — Study Planner",
            marginL,
            pageH - 9
          );
          doc.text(`Page ${p} of ${total}`, pageW - marginR, pageH - 9, {
            align: "right",
          });
        }
      };

      drawHeader(true);

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
          y += 3;
          continue;
        }

        // Section headings
        if (
          /^(TOPIC:|SUBJECT:|DIFFICULTY:|SIMPLE EXPLANATION:|REAL-LIFE ANALOGY:|KEY TAKEAWAY:|IN ONE LINE:|WHAT IS IT\?|HOW DOES IT WORK\?|KEY CONCEPTS:|FORMULAS|KEY EQUATIONS|REAL-WORLD APPLICATIONS:|EXAMPLES:|COMMON MISCONCEPTIONS:|WHY IT MATTERS:|SUMMARY:|DOUBT:|ANSWER:|EXPLANATION:|EXAMPLE:)/i.test(
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

        // Numbered concepts (1. Concept)
        if (/^\d+\.\s/.test(trimmed) && trimmed.length < 120) {
          ensureSpace(12);
          y += 2;
          const numLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = numLines.length * 5 + 4;
          doc.setFillColor(gray100.r, gray100.g, gray100.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          doc.setFillColor(emerald.r, emerald.g, emerald.b);
          doc.roundedRect(marginL, y - 4, 1.2, blockH, 0.6, 0.6, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          doc.text(numLines, marginL + 5, y);
          y += blockH + 2;
          continue;
        }

        // Example headers
        if (/^Example \d+:/i.test(trimmed)) {
          ensureSpace(10);
          y += 2;
          const hLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = hLines.length * 5 + 4;
          doc.setFillColor(greenBg.r, greenBg.g, greenBg.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          doc.setFillColor(emerald.r, emerald.g, emerald.b);
          doc.roundedRect(marginL, y - 4, 1.5, blockH, 0.7, 0.7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(emerald.r, emerald.g, emerald.b);
          doc.text(hLines, marginL + 6, y);
          y += blockH + 2;
          continue;
        }

        // Misconception lines
        if (/^[-•]\s.*:\s/.test(trimmed) && trimmed.length < 200) {
          ensureSpace(8);
          const colonIdx = trimmed.indexOf(":");
          const term = trimmed.slice(0, colonIdx + 1).replace(/^[-•]\s*/, "");
          const correction = trimmed.slice(colonIdx + 1).trim();

          doc.setFillColor(amberBg.r, amberBg.g, amberBg.b);
          const termW = doc.getTextWidth(term) + 6;
          doc.roundedRect(marginL + 4, y - 3.5, termW, 5.5, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(amber.r, amber.g, amber.b);
          doc.text(term, marginL + 7, y);

          if (correction) {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(gray700.r, gray700.g, gray700.b);
            const defLines = doc.splitTextToSize(
              correction,
              contentW - termW - 12
            );
            doc.text(defLines, marginL + 7 + termW + 2, y);
            y += Math.max(defLines.length * 4.5, 5) + 2;
          } else {
            y += 6;
          }
          continue;
        }

        // Bullet points
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

        // Default text
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
        doc.text(`AI Tutor  —  ${title}`, marginL, 8);
      }

      drawFooters();

      const dateStr = actualEntry 
        ? new Date(actualEntry.createdAt).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0];

      const fileName = rTopic.trim() || "explanation";
      doc.save(
        `tutor-${rType}-${fileName.replace(/\s+/g, "-").toLowerCase()}-${dateStr}.pdf`
      );
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "simple") return <Lightbulb className="h-3 w-3" />;
    if (type === "deep") return <Brain className="h-3 w-3" />;
    return <HelpCircle className="h-3 w-3" />;
  };

  const getTypeLabel = (type: string) => {
    if (type === "simple") return "Simple";
    if (type === "deep") return "Deep";
    return "Doubt";
  };

  const getTypeColor = (type: string) => {
    if (type === "simple")
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    if (type === "deep")
      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <Card className="relative overflow-hidden border border-border/60 mx-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#e11d4820,transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-rose-500/10 to-transparent" />
        <CardHeader className="relative space-y-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                AI Tutor (Explain Mode)
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Get crystal-clear explanations — simple analogies, deep dives,
                or instant doubt solving.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <Lightbulb className="h-3 w-3 text-rose-500" />
              Simple Explain
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <Brain className="h-3 w-3 text-indigo-500" />
              Deep Explain
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <HelpCircle className="h-3 w-3 text-amber-500" />
              Doubt Solver
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 sm:px-3 sm:py-1">
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
          <TabsTrigger value="simple" className="gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            Simple Explain
          </TabsTrigger>
          <TabsTrigger value="deep" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            Deep Explain
          </TabsTrigger>
          <TabsTrigger value="doubt" className="gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            Doubt Solver
          </TabsTrigger>
        </TabsList>

        {/* ─── SIMPLE EXPLAIN ─── */}
        <TabsContent value="simple">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Simple Explain (Quick Understanding)</CardTitle>
                <CardDescription>
                  Get a beginner-friendly explanation with real-life analogies
                  and key takeaways. Perfect for first-time learning.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Topic / Concept *
                    </label>
                    <Input
                      placeholder="e.g., Gravity, Recursion, Supply & Demand"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject (optional)
                    </label>
                    <Input
                      placeholder="e.g., Physics, Computer Science, Economics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional context (optional)
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g., Explain for a 10-year-old, Focus on the formula, Include diagrams..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lightbulb className="mr-2 h-4 w-4" />
                    )}
                    Explain Simply
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Costs 1 AI Credit
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">What you'll get</CardTitle>
                <CardDescription>
                  Easy-to-understand explanations with analogies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>💡 Simple, everyday language explanation</p>
                <p>🎭 Real-life analogy that makes it click</p>
                <p>🔑 Key takeaway points</p>
                <p>✨ One-line memorable summary</p>
                <p>🚫 No jargon — pure understanding</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── DEEP EXPLAIN ─── */}
        <TabsContent value="deep">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Deep Explain (Thorough Understanding)</CardTitle>
                <CardDescription>
                  Get a comprehensive explanation with step-by-step breakdowns,
                  examples, formulas, real-world applications, and common
                  misconceptions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Topic / Concept *
                    </label>
                    <Input
                      placeholder="e.g., Gravity, Recursion, Supply & Demand"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject (optional)
                    </label>
                    <Input
                      placeholder="e.g., Physics, Computer Science, Economics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
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
                    placeholder="e.g., Include mathematical derivation, Focus on exam-style explanations..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 h-4 w-4" />
                    )}
                    Deep Explain
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Costs 2 AI Credits
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">What you'll get</CardTitle>
                <CardDescription>
                  Master-level understanding with full depth.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>📖 What it is + How it works</p>
                <p>🔢 Formulas and key equations</p>
                <p>🌍 Real-world applications</p>
                <p>📝 Worked examples with steps</p>
                <p>⚠️ Common misconceptions corrected</p>
                <p>🎯 Why it matters for exams and life</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── DOUBT SOLVER ─── */}
        <TabsContent value="doubt">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Doubt Solver (Ask Anything)</CardTitle>
                <CardDescription>
                  Got stuck? Ask your specific doubt and get a clear, focused
                  answer with an example.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Your Doubt / Question *
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="e.g., Why does ice float on water? What's the difference between stack and heap? How does compound interest work?"
                    value={doubt}
                    onChange={(e) => setDoubt(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Related Topic (optional)
                    </label>
                    <Input
                      placeholder="e.g., Density, Memory Management, Finance"
                      value={originalTopic}
                      onChange={(e) => setOriginalTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject (optional)
                    </label>
                    <Input
                      placeholder="e.g., Chemistry, CS, Mathematics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <HelpCircle className="mr-2 h-4 w-4" />
                    )}
                    Solve My Doubt
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Costs 1 AI Credit
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">What you'll get</CardTitle>
                <CardDescription>
                  Direct answers to your specific questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>🎯 Direct, focused answer to your doubt</p>
                <p>📖 Clear explanation of the concept</p>
                <p>💡 Illustrative example</p>
                <p>⚡ Quick and to the point</p>
                <p>🔗 Connected to the original topic</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error / Success */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action needed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40">
          <AlertTitle className="text-green-800 dark:text-green-300">
            Success
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Explanation saved to your history!
          </AlertDescription>
        </Alert>
      )}

      {/* AI Output */}
      {result && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 px-4 py-4 sm:px-6">
            <div>
              <CardTitle className="text-lg sm:text-2xl">
                {mode === "simple"
                  ? "💡 Simple Explanation"
                  : mode === "deep"
                    ? "🧠 Deep Explanation"
                    : "❓ Doubt Solved"}
              </CardTitle>
              <CardDescription className="mt-1">
                {mode === "doubt" ? doubt.trim() : topic.trim()}{" "}
                {subject.trim() ? `— ${subject.trim()}` : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {user && (
                <Button
                  onClick={() => saveEntry()}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  Save
                </Button>
              )}
              <Button
                onClick={() => downloadPDF()}
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
                const t = line.trim();
                const isHeading =
                  /^(TOPIC:|SUBJECT:|DIFFICULTY:|SIMPLE EXPLANATION:|REAL-LIFE ANALOGY:|KEY TAKEAWAY:|IN ONE LINE:|WHAT IS IT\?|HOW DOES IT WORK\?|KEY CONCEPTS:|FORMULAS|KEY EQUATIONS|REAL-WORLD APPLICATIONS:|EXAMPLES:|COMMON MISCONCEPTIONS:|WHY IT MATTERS:|SUMMARY:|DOUBT:|ANSWER:|EXPLANATION:|EXAMPLE:)/i.test(
                    t
                  );
                const isNumbered =
                  /^\d+\.\s/.test(t) && t.length < 120;
                const isExample = /^Example \d+:/i.test(t);

                return (
                  <div
                    key={idx}
                    className={`min-h-7 sm:min-h-8 py-0.5 sm:py-1 px-2 sm:px-4 hover:bg-primary/5 transition-colors rounded ${
                      /^[-•]\s/.test(t) ? "pl-4 sm:pl-6" : ""
                    }`}
                  >
                    <div
                      className={`${
                        isHeading
                          ? "font-bold text-rose-600 dark:text-rose-400 text-base sm:text-lg mt-2"
                          : isExample
                            ? "font-bold text-emerald-600 dark:text-emerald-400 mt-2"
                            : isNumbered
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

      {/* History */}
      {user && entries.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">
              Tutor History
            </CardTitle>
            <CardDescription>
              Your saved explanations — view, edit, or download anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.$id}
                    className="p-3 sm:p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {editingEntryId === entry.$id ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Topic
                            </label>
                            <Input
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
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
                              Type
                            </label>
                            <div className="flex gap-2">
                              {(
                                ["simple", "deep", "doubt"] as const
                              ).map((t) => (
                                <Button
                                  key={t}
                                  type="button"
                                  variant={
                                    editExplainType === t
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setEditExplainType(t)}
                                >
                                  {t.charAt(0).toUpperCase() + t.slice(1)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Content
                          </label>
                          <Textarea
                            rows={6}
                            value={editTutorContent}
                            onChange={(e) =>
                              setEditTutorContent(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={updateEntryHistory}
                            size="sm"
                            className="gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Update
                          </Button>
                          <Button
                            onClick={cancelEditEntry}
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
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {entry.topic}
                            </h3>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${getTypeColor(entry.explainType)}`}
                              >
                                {getTypeIcon(entry.explainType)}
                                {getTypeLabel(entry.explainType)}
                              </span>
                              {entry.subject && (
                                <span>{entry.subject}</span>
                              )}
                              {entry.level && (
                                <span>Level: {entry.level}</span>
                              )}
                              <span>
                                {new Date(
                                  entry.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Button
                              onClick={() =>
                                setExpandedEntryId(
                                  expandedEntryId === entry.$id
                                    ? null
                                    : entry.$id || null
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              {expandedEntryId === entry.$id
                                ? "Collapse"
                                : "View"}
                            </Button>
                            <Button
                              onClick={() => startEditEntry(entry)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => downloadPDF(entry)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                            <Button
                              onClick={() => requestDeleteEntry(entry)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {expandedEntryId === entry.$id && (
                          <div className="mt-4 p-3 sm:p-4 rounded-lg bg-muted/40 border border-border/40">
                            <div className="space-y-0 leading-7 text-sm font-sans max-h-96 overflow-y-auto">
                              {entry.tutorContent
                                .split("\n")
                                .map((line, idx) => {
                                  const t = line.trim();
                                  const isH =
                                    /^(TOPIC:|SUBJECT:|SIMPLE EXPLANATION:|REAL-LIFE ANALOGY:|KEY TAKEAWAY:|IN ONE LINE:|WHAT IS IT|HOW DOES IT WORK|KEY CONCEPTS:|FORMULAS|REAL-WORLD|EXAMPLES:|COMMON MISCONCEPTIONS:|WHY IT MATTERS:|SUMMARY:|DOUBT:|ANSWER:|EXPLANATION:|EXAMPLE:)/i.test(
                                      t
                                    );
                                  return (
                                    <div
                                      key={idx}
                                      className="min-h-6 py-0.5 px-2"
                                    >
                                      <div
                                        className={
                                          isH
                                            ? "font-bold text-rose-600 dark:text-rose-400"
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

      {/* Delete Dialog */}
      <AlertDialog
        open={Boolean(entryPendingDelete)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteLoading) setEntryPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this explanation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove
              {entryPendingDelete
                ? ` "${entryPendingDelete.topic}"`
                : " this entry"}{" "}
              from history. You can undo right after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteEntry();
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
