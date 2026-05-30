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
  FileText,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  Zap,
  BookOpen,
  Eye,
} from "lucide-react";
import { generateShortNotes, generateFullNotes } from "../services/aiNotesService";
import databaseService, { NotesHistory } from "../services/databaseService";
import planService, { UserPlan } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const AiNotesGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);

  const [mode, setMode] = useState("short");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<NotesHistory[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editNoteType, setEditNoteType] = useState<"short" | "full">("short");
  const [editNotesContent, setEditNotesContent] = useState("");
  const [notePendingDelete, setNotePendingDelete] = useState<NotesHistory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Load notes and active plan on mount
  useEffect(() => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (resolvedUserId) {
      loadNotes();
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

  const loadNotes = async () => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId) return;
    setNotesLoading(true);
    try {
      const userNotes = await databaseService.getNotes(resolvedUserId);
      setNotes(userNotes);
    } catch (err) {
      console.error("Failed to load notes history:", err);
    } finally {
      setNotesLoading(false);
    }
  };

  const saveNote = async (notesContent?: string) => {
    const contentToSave = notesContent || result;
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId || !contentToSave) return;

    try {
      const newNote: Omit<NotesHistory, "$id"> = {
        userId: resolvedUserId,
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        noteType: mode as "short" | "full",
        notesContent: contentToSave,
        createdAt: new Date().toISOString(),
      };

      await databaseService.createNote(newNote);
      toast.success("Notes saved to history!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadNotes();
    } catch (err) {
      console.error("Save note error:", err);
      const message = err instanceof Error ? err.message : "Failed to save notes.";
      toast.error(message);
      setError(message);
    }
  };

  const requestDeleteNote = (note: NotesHistory) => {
    setNotePendingDelete(note);
  };

  const undoDeleteNote = async (note: NotesHistory) => {
    try {
      const restoredNote: Omit<NotesHistory, "$id"> = {
        userId: note.userId,
        topic: note.topic,
        subject: note.subject,
        noteType: note.noteType,
        notesContent: note.notesContent,
        createdAt: note.createdAt,
      };
      await databaseService.createNote(restoredNote);
      await loadNotes();
      toast.success("Note restored to history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore note.");
    }
  };

  const confirmDeleteNote = async () => {
    if (!notePendingDelete?.$id) return;

    const deletedNote = notePendingDelete;
    setDeleteLoading(true);
    setNotePendingDelete(null);

    try {
      setNotes((prev) => prev.filter((note) => note.$id !== deletedNote.$id));
      if (editingNoteId === deletedNote.$id) {
        cancelEditNote();
      }
      if (expandedNoteId === deletedNote.$id) {
        setExpandedNoteId(null);
      }
      await databaseService.deleteNote(deletedNote.$id);
      toast.success("Note deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void undoDeleteNote(deletedNote);
          },
        },
      });
    } catch (err) {
      await loadNotes();
      setError(err instanceof Error ? err.message : "Failed to delete note.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEditNote = (note: NotesHistory) => {
    if (!note.$id) return;
    setEditingNoteId(note.$id);
    setEditTopic(note.topic);
    setEditSubject(note.subject || "");
    setEditNoteType(note.noteType);
    setEditNotesContent(note.notesContent);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditTopic("");
    setEditSubject("");
    setEditNoteType("short");
    setEditNotesContent("");
  };

  const updateNoteHistory = async () => {
    if (!editingNoteId) return;
    if (!editTopic.trim() || !editNotesContent.trim()) {
      setError("Topic and notes content are required to update.");
      return;
    }

    try {
      await databaseService.updateNote(editingNoteId, {
        topic: editTopic.trim(),
        subject: editSubject.trim() || undefined,
        noteType: editNoteType,
        notesContent: editNotesContent.trim(),
      });
      cancelEditNote();
      await loadNotes();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note.");
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    if (!topic.trim()) {
      setError("Please enter a topic for notes generation.");
      return;
    }

    const resolvedUserId = user?.$id || (user as any)?.id || user?.id || "test-user";
    const userPlan = await planService.getUserPlan(resolvedUserId);

    const creditsNeeded = mode === "short" ? 1 : 2;

    if (userPlan.aiCredits < creditsNeeded) {
      setError(
        `Insufficient AI Credits. ${mode === "short" ? "Short Notes require 1 credit" : "Full Notes require 2 credits"}, but you only have ${userPlan.aiCredits} remaining. Please navigate to 'Billing & Plans' in the sidebar to upgrade or refill your credits.`
      );
      toast.error("Insufficient AI Credits!");
      return;
    }

    setLoading(true);
    try {
      const input = {
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
      };

      const output =
        mode === "short"
          ? await generateShortNotes(input)
          : await generateFullNotes(input);

      const notesOutput = output || "No response returned from the model.";
      setResult(notesOutput);

      // Deduct credits on success
      if (notesOutput !== "No response returned from the model.") {
        await planService.deductCredits(
          resolvedUserId,
          `AI Notes (${mode === "short" ? "Short" : "Full"}) - Topic: ${topic.trim()}`,
          creditsNeeded
        );

        // Auto-save to history
        if (resolvedUserId) {
          try {
            await saveNote(notesOutput);
            toast.success(
              `${mode === "short" ? "Short" : "Full"} notes generated and saved! (${creditsNeeded} AI Credit${creditsNeeded > 1 ? "s" : ""} deducted)`
            );
          } catch {
            console.warn("Auto-save failed, notes can be saved manually.");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate notes.");
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════
  // PDF DOWNLOAD — Beautiful styled notes PDF
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
      const isShort = mode === "short";
      const title = isShort ? "Quick Revision Notes" : "Detailed Study Notes";
      let y = 0;

      // ── Color palette ──
      const teal = { r: 13, g: 148, b: 136 };
      const darkTeal = { r: 15, g: 118, b: 110 };
      const emerald = { r: 5, g: 150, b: 105 };
      const violet = { r: 124, g: 58, b: 237 };
      const darkViolet = { r: 91, g: 33, b: 182 };
      const gray50 = { r: 249, g: 250, b: 251 };
      const gray100 = { r: 243, g: 244, b: 246 };
      const gray300 = { r: 209, g: 213, b: 219 };
      const gray500 = { r: 107, g: 114, b: 128 };
      const gray700 = { r: 55, g: 65, b: 81 };
      const gray900 = { r: 17, g: 24, b: 39 };
      const tealBg = { r: 240, g: 253, b: 250 };
      const violetBg = { r: 245, g: 243, b: 255 };
      const amberBg = { r: 255, g: 251, b: 235 };
      const amber700 = { r: 180, g: 83, b: 9 };

      const primary = isShort ? teal : violet;
      const primaryDark = isShort ? darkTeal : darkViolet;
      const primaryBg = isShort ? tealBg : violetBg;

      // ── Helper: page break ──
      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 22) {
          doc.addPage();
          y = 20;
        }
      };

      // ── Draw header ──
      const drawHeader = (isFirst: boolean) => {
        // Gradient-like header band
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.rect(0, 0, pageW, isFirst ? 42 : 12, "F");
        // Dark accent strip
        doc.setFillColor(primaryDark.r, primaryDark.g, primaryDark.b);
        doc.rect(0, 0, pageW, 3.5, "F");

        if (isFirst) {
          // App name
          doc.setFont("helvetica", "bold");
          doc.setFontSize(21);
          doc.setTextColor(255, 255, 255);
          doc.text("AI Notes Generator", marginL, 18);

          // Badge
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          const badgeText = `  ${title}  `;
          const badgeW = doc.getTextWidth(badgeText) + 4;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginL, 23, badgeW, 6.5, 1.5, 1.5, "F");
          doc.setTextColor(primary.r, primary.g, primary.b);
          doc.text(badgeText.trim(), marginL + 2, 27.2);

          // Date
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

          // Topic line
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const topicLabel = topic.trim() || "General Notes";
          const topicLines = doc.splitTextToSize(topicLabel, contentW);
          doc.text(topicLines, marginL, y);
          y += topicLines.length * 5 + 2;

          // Subject & type badges
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const badges = [
            `Type: ${isShort ? "Short Notes" : "Full Notes"}`,
            ...(subject.trim() ? [`Subject: ${subject.trim()}`] : []),
            `Generated: ${new Date().toLocaleDateString()}`,
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

          // Divider
          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, pageW - marginR, y);
          y += 7;
        } else {
          y = 18;
        }
      };

      // ── Draw footers ──
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
          doc.text("Generated by AI Notes Generator — Study Planner", marginL, pageH - 9);
          doc.text(`Page ${p} of ${total}`, pageW - marginR, pageH - 9, {
            align: "right",
          });
        }
      };

      // ── Render first-page header ──
      drawHeader(true);

      // ── Process content lines ──
      const lines = result.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3;
          continue;
        }

        // --- SECTION HEADINGS (ALL CAPS labels like TITLE:, KEY POINTS:, OVERVIEW:, SUMMARY:, etc.) ---
        if (
          /^(TITLE:|KEY POINTS:|IMPORTANT TERMS:|KEY FORMULAS|MEMORY TRICKS|OVERVIEW:|MAIN CONCEPTS:|EXAMPLES|SUMMARY:|DETAILED EXPLANATION:|CASE STUDIES:)/i.test(
            trimmed
          )
        ) {
          ensureSpace(14);
          if (y > 55) y += 4;

          // Section header block
          const hLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = hLines.length * 5 + 5;
          doc.setFillColor(primaryBg.r, primaryBg.g, primaryBg.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          // Accent bar
          doc.setFillColor(primary.r, primary.g, primary.b);
          doc.roundedRect(marginL, y - 4, 1.5, blockH, 0.7, 0.7, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(primaryDark.r, primaryDark.g, primaryDark.b);
          doc.text(hLines, marginL + 6, y + 1);
          y += blockH + 3;
          continue;
        }

        // --- Numbered headings (1. Heading, 2. Heading) ---
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

        // --- Bullet points (- or •) ---
        if (/^[-•]\s/.test(trimmed)) {
          ensureSpace(7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(gray700.r, gray700.g, gray700.b);
          // Colored bullet dot
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

        // --- Definition lines (Term: definition) ---
        if (/^[-•]?\s*[A-Z][\w\s]+:/.test(trimmed) && trimmed.includes(":")) {
          ensureSpace(8);
          const colonIdx = trimmed.indexOf(":");
          const term = trimmed.slice(0, colonIdx + 1);
          const definition = trimmed.slice(colonIdx + 1).trim();

          // Highlight chip for term
          doc.setFillColor(amberBg.r, amberBg.g, amberBg.b);
          const termW = doc.getTextWidth(term) + 6;
          doc.roundedRect(marginL + 4, y - 3.5, termW, 5.5, 1, 1, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(amber700.r, amber700.g, amber700.b);
          doc.text(term, marginL + 7, y);

          if (definition) {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(gray700.r, gray700.g, gray700.b);
            const defLines = doc.splitTextToSize(
              definition,
              contentW - termW - 12
            );
            doc.text(defLines, marginL + 7 + termW + 2, y);
            y += Math.max(defLines.length * 4.5, 5) + 2;
          } else {
            y += 6;
          }
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

      // ── Continuation headers on pages 2+ ──
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
        doc.text(`AI Notes Generator  —  ${title}`, marginL, 8);
      }

      // ── Draw footers ──
      drawFooters();

      // ── Save ──
      doc.save(
        `notes-${mode}-${topic.trim().replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#14b8a620,transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-teal-500/10 to-transparent" />
        <CardHeader className="relative space-y-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                AI Notes Generator
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Generate structured study notes instantly — short revision or
                detailed learning mode.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Short Notes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <BookOpen className="h-3 w-3 text-violet-500" />
              Full Notes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              Structured Output
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 sm:px-3 sm:py-1">
              ⚡{" "}
              {activePlan !== null
                ? `${activePlan.aiCredits} AI Credits`
                : "AI Credits Balance"}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs: Short Notes / Full Notes */}
      <Tabs value={mode} onValueChange={setMode} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="short" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Short Notes
          </TabsTrigger>
          <TabsTrigger value="full" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Full Notes
          </TabsTrigger>
        </TabsList>

        {/* ─── SHORT NOTES TAB ─── */}
        <TabsContent value="short">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Short Notes (Quick Revision)</CardTitle>
                <CardDescription>
                  Concise bullet-point notes with key definitions, formulas, and
                  memory tricks. Perfect for last-minute revision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic *</label>
                    <Input
                      placeholder="e.g., Photosynthesis, Quadratic Equations"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject (optional)
                    </label>
                    <Input
                      placeholder="e.g., Biology, Mathematics, History"
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
                    placeholder="e.g., Focus on Chapter 5, CBSE Board, Grade 10 level..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Generate Short Notes
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
                  Optimized for quick revision before exams.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>📌 Key points as concise bullet points</p>
                <p>📖 Important terms with one-line definitions</p>
                <p>🔢 Key formulas (if applicable)</p>
                <p>🧠 Memory tricks and mnemonics</p>
                <p>⚡ No lengthy explanations — exam-ready</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── FULL NOTES TAB ─── */}
        <TabsContent value="full">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Full Notes (Detailed Learning)</CardTitle>
                <CardDescription>
                  In-depth study notes with structured headings, step-by-step
                  explanations, examples, and summaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic *</label>
                    <Input
                      placeholder="e.g., Photosynthesis, Quadratic Equations"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subject (optional)
                    </label>
                    <Input
                      placeholder="e.g., Biology, Mathematics, History"
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
                    placeholder="e.g., Focus on Chapter 5, Include diagrams, A-Level syllabus..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BookOpen className="mr-2 h-4 w-4" />
                    )}
                    Generate Full Notes
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
                  Deep, structured notes for thorough understanding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>📘 Complete topic overview</p>
                <p>📑 Structured headings and subheadings</p>
                <p>🔍 Step-by-step explanations</p>
                <p>💡 Real-world examples and case studies</p>
                <p>📝 Comprehensive summary for revision</p>
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
            Notes saved successfully to your history!
          </AlertDescription>
        </Alert>
      )}

      {/* AI Output */}
      {result && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 px-4 py-4 sm:px-6">
            <div>
              <CardTitle className="text-lg sm:text-2xl">
                {mode === "short"
                  ? "📋 Quick Revision Notes"
                  : "📘 Detailed Study Notes"}
              </CardTitle>
              <CardDescription className="mt-1">
                {topic.trim()} {subject.trim() ? `— ${subject.trim()}` : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {user && (
                <Button
                  onClick={() => saveNote()}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Save Notes
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
                const isHeading =
                  /^(TITLE:|KEY POINTS:|IMPORTANT TERMS:|KEY FORMULAS|MEMORY TRICKS|OVERVIEW:|MAIN CONCEPTS:|EXAMPLES|SUMMARY:|DETAILED EXPLANATION:|CASE STUDIES:)/i.test(
                    line.trim()
                  );
                const isNumberedHeading =
                  /^\d+\.\s/.test(line.trim()) && line.trim().length < 120;
                const isBullet = /^[-•]\s/.test(line.trim());

                return (
                  <div
                    key={idx}
                    className={`min-h-7 sm:min-h-8 py-0.5 sm:py-1 px-2 sm:px-4 hover:bg-primary/5 transition-colors rounded ${
                      isBullet ? "pl-4 sm:pl-6" : ""
                    }`}
                  >
                    <div
                      className={`${
                        isHeading
                          ? "font-bold text-teal-600 dark:text-teal-400 text-base sm:text-lg mt-2"
                          : isNumberedHeading
                            ? "font-semibold text-foreground text-base"
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

      {/* Notes History */}
      {user && notes.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Notes History</CardTitle>
            <CardDescription>
              Your saved notes — view, edit, or download anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.$id}
                    className="p-3 sm:p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {editingNoteId === note.$id ? (
                      /* ── Edit Mode ── */
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
                              Note type
                            </label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  editNoteType === "short"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditNoteType("short")}
                              >
                                Short
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  editNoteType === "full"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditNoteType("full")}
                              >
                                Full
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Notes content
                          </label>
                          <Textarea
                            rows={6}
                            value={editNotesContent}
                            onChange={(e) =>
                              setEditNotesContent(e.target.value)
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={updateNoteHistory}
                            size="sm"
                            className="gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Update
                          </Button>
                          <Button
                            onClick={cancelEditNote}
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
                              {note.topic}
                            </h3>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                                  note.noteType === "short"
                                    ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                                    : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                }`}
                              >
                                {note.noteType === "short" ? (
                                  <Zap className="h-3 w-3" />
                                ) : (
                                  <BookOpen className="h-3 w-3" />
                                )}
                                {note.noteType === "short"
                                  ? "Short Notes"
                                  : "Full Notes"}
                              </span>
                              {note.subject && (
                                <span>Subject: {note.subject}</span>
                              )}
                              <span>
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Button
                              onClick={() =>
                                setExpandedNoteId(
                                  expandedNoteId === note.$id
                                    ? null
                                    : note.$id || null
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              {expandedNoteId === note.$id
                                ? "Collapse"
                                : "View"}
                            </Button>
                            <Button
                              onClick={() => startEditNote(note)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => requestDeleteNote(note)}
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Expandable note content */}
                        {expandedNoteId === note.$id && (
                          <div className="mt-4 p-3 sm:p-4 rounded-lg bg-muted/40 border border-border/40">
                            <div className="space-y-0 leading-7 text-sm font-sans max-h-96 overflow-y-auto">
                              {note.notesContent.split("\n").map((line, idx) => {
                                const isHeading =
                                  /^(TITLE:|KEY POINTS:|IMPORTANT TERMS:|KEY FORMULAS|MEMORY TRICKS|OVERVIEW:|MAIN CONCEPTS:|EXAMPLES|SUMMARY:|DETAILED EXPLANATION:|CASE STUDIES:)/i.test(
                                    line.trim()
                                  );
                                return (
                                  <div
                                    key={idx}
                                    className="min-h-6 py-0.5 px-2"
                                  >
                                    <div
                                      className={
                                        isHeading
                                          ? "font-bold text-teal-600 dark:text-teal-400"
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
        open={Boolean(notePendingDelete)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteLoading) {
            setNotePendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this saved note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove
              {notePendingDelete
                ? ` "${notePendingDelete.topic}"`
                : " this note"}{" "}
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
                void confirmDeleteNote();
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
