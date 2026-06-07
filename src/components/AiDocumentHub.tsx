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
} from "../app/components/ui/dialog";
import {
  Loader2,
  FileText,
  Download,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Layers,
  Map,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  UploadCloud,
  ClipboardCopy,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { processDocumentWithAI } from "../services/aiDocumentHubService";
import { evaluateQuiz } from "../services/aiQuizService";
import databaseService from "../services/databaseService";
import planService, { UserPlan } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ParsedQuestion {
  number: number;
  text: string;
  options: string[];
  type: "mcq" | "short";
}

interface HistoryItem {
  id: string;
  type: "summary" | "roadmap" | "quiz" | "flashcards";
  title: string;
  content: string;
  subject?: string;
  createdAt: string;
  rawObject: any;
}

export const AiDocumentHub: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  // App States
  const [taskType, setTaskType] = useState<"summary" | "roadmap" | "quiz" | "flashcards">("summary");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing document...");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz Playable State
  const [quizQuestions, setQuizQuestions] = useState<ParsedQuestion[]>([]);
  const [quizTopic, setQuizTopic] = useState("");
  const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<string | null>(null);

  // Flashcards Study State
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // History States
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"process" | "history">("process");

  // Edit Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active plan and history on mount
  useEffect(() => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (resolvedUserId) {
      planService.getUserPlan(resolvedUserId).then(setActivePlan);
      loadHistory();
    }
  }, [user]);

  // Load Combined History
  const loadHistory = async () => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId) return;
    setHistoryLoading(true);

    try {
      const [notesData, roadmapsData, quizzesData] = await Promise.all([
        databaseService.getNotes(resolvedUserId),
        databaseService.getRoadmaps(resolvedUserId),
        databaseService.getQuizzes(resolvedUserId),
      ]);

      const items: HistoryItem[] = [];

      // 1. Process Notes (Summaries and Flashcards)
      notesData.forEach((note) => {
        const isFlashcard = note.subject === "Document Hub - Flashcards";
        const isSummary =
          note.subject === "Document Hub" ||
          note.subject === "Document Hub - Summary" ||
          note.topic.startsWith("Summary:") ||
          note.topic.startsWith("Summary: ");

        if (isFlashcard || isSummary || note.subject === "Document Hub") {
          items.push({
            id: note.$id!,
            type: isFlashcard ? "flashcards" : "summary",
            title: note.topic,
            content: note.notesContent,
            subject: note.subject,
            createdAt: note.createdAt,
            rawObject: note,
          });
        }
      });

      // 2. Process Roadmaps
      roadmapsData.forEach((rm) => {
        const isRoadmap =
          rm.subject === "Document Hub" ||
          rm.subject === "Document Hub - Roadmap" ||
          rm.goal.startsWith("Roadmap:") ||
          rm.goal.startsWith("Roadmap: ");

        if (isRoadmap) {
          items.push({
            id: rm.$id!,
            type: "roadmap",
            title: rm.goal,
            content: rm.roadmapContent,
            subject: rm.subject,
            createdAt: rm.createdAt,
            rawObject: rm,
          });
        }
      });

      // 3. Process Quizzes
      quizzesData.forEach((q) => {
        items.push({
          id: q.$id!,
          type: "quiz",
          title: q.topic,
          content: q.quizContent,
          createdAt: q.createdAt,
          rawObject: q,
        });
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistoryList(items);
    } catch (err) {
      console.error("Failed to load document history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64 = resultStr.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (file: File) => {
    const limit = 20 * 1024 * 1024;
    if (file.size > limit) {
      toast.error("File is too large! Maximum supported size is 20MB.");
      return;
    }

    const supportedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "text/plain",
    ];

    if (!supportedTypes.includes(file.type)) {
      toast.error("Unsupported file format. Please upload PDF, PNG, JPG, or TXT.");
      return;
    }

    try {
      setSelectedFile(file);
      setMimeType(file.type);
      const base64 = await fileToBase64(file);
      setBase64Data(base64);
      setError(null);
      setResult(null);
      setQuizQuestions([]);
      setFlashcards([]);
      setStudentAnswers({});
      setQuizSubmitted(false);
      setGradingResult(null);
      toast.success(`${file.name} uploaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to read the file.");
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Parse Quiz Output
  const parseQuizText = (text: string): { topic: string; questions: ParsedQuestion[] } => {
    const lines = text.split("\n");
    let topic = "Document Study Quiz";
    const questions: ParsedQuestion[] = [];
    let currentQuestion: ParsedQuestion | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.toLowerCase().startsWith("quiz topic:")) {
        topic = line.substring(11).trim();
        continue;
      }

      const questionMatch = line.match(/^Q(\d+)\.\s+(.+)$/i);
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          number: parseInt(questionMatch[1]),
          text: questionMatch[2],
          options: [],
          type: "short",
        };
        continue;
      }

      const optionMatch = line.match(/^([A-D])\)\s+(.+)$/i);
      if (optionMatch && currentQuestion) {
        currentQuestion.options.push(line);
        currentQuestion.type = "mcq";
        continue;
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return { topic, questions };
  };

  // Submit study process to AI
  const handleProcess = async () => {
    setError(null);
    setResult(null);
    setQuizQuestions([]);
    setFlashcards([]);
    setGradingResult(null);
    setQuizSubmitted(false);
    setStudentAnswers({});

    if (!base64Data) {
      setError("Please upload a file first.");
      return;
    }

    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId) return;

    const creditsNeeded = 2;
    if (!activePlan || activePlan.aiCredits < creditsNeeded) {
      setError(
        `Insufficient AI Credits. Processing a document requires ${creditsNeeded} credits, but you only have ${activePlan?.aiCredits || 0} remaining. Please upgrade or refill your credits.`
      );
      toast.error("Insufficient AI Credits!");
      return;
    }

    setLoading(true);
    const textMap = {
      summary: "AI is parsing document layout and generating academic summaries...",
      roadmap: "AI is structuring a progressive learning roadmap from material...",
      quiz: "AI is drafting exam-style questions from your notes...",
      flashcards: "AI is building custom visual flashcard decks...",
    };
    setLoadingText(textMap[taskType]);

    try {
      const output = await processDocumentWithAI(base64Data, mimeType, taskType);
      
      if (!output || output.includes("Direct Gemini API Key is missing")) {
        throw new Error("AI Processing failed. Make sure your Gemini API Key is active.");
      }

      setResult(output);

      // Deduct Credits
      await planService.deductCredits(
        resolvedUserId,
        `Processed document (${taskType}) - ${selectedFile?.name}`,
        creditsNeeded
      );

      // Refresh credits balance in header
      const updatedPlan = await planService.getUserPlan(resolvedUserId);
      setActivePlan(updatedPlan);

      // Post-process specific task types and Auto-Save to Appwrite
      if (taskType === "quiz") {
        const parsed = parseQuizText(output);
        setQuizTopic(parsed.topic);
        setQuizQuestions(parsed.questions);

        try {
          await databaseService.createQuiz({
            userId: resolvedUserId,
            topic: parsed.topic,
            difficulty: "Medium",
            questionCount: parsed.questions.length,
            questionType: parsed.questions.some(q => q.type === "mcq") ? "mcq" : "short",
            quizContent: output,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Could not auto-save quiz to history:", dbErr);
        }
      } else if (taskType === "flashcards") {
        try {
          const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsedCards = JSON.parse(cleanJson);
          if (Array.isArray(parsedCards)) {
            setFlashcards(parsedCards);
            setCurrentCardIndex(0);
            setIsFlipped(false);

            await databaseService.createNote({
              userId: resolvedUserId,
              topic: `Flashcards: ${selectedFile?.name || "Uploaded Document"}`,
              subject: "Document Hub - Flashcards",
              noteType: "short",
              notesContent: output,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (jsonErr) {
          console.error("Failed parsing flashcards JSON. Raw output:", output);
          setError("Failed to parse flashcards structure. Raw response shown in main viewer.");
        }
      } else if (taskType === "summary") {
        try {
          await databaseService.createNote({
            userId: resolvedUserId,
            topic: `Summary: ${selectedFile?.name || "Uploaded Document"}`,
            subject: "Document Hub - Summary",
            noteType: "full",
            notesContent: output,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Could not auto-save notes summary to history:", dbErr);
        }
      } else if (taskType === "roadmap") {
        try {
          await databaseService.createRoadmap({
            userId: resolvedUserId,
            goal: `Roadmap: ${selectedFile?.name || "Uploaded Document"}`,
            subject: "Document Hub - Roadmap",
            roadmapContent: output,
            createdAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Could not auto-save roadmap to history:", dbErr);
        }
      }

      await loadHistory();
      toast.success("Study materials generated and saved to history!");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "AI generation failed.");
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit student answers for grading
  const handleQuizSubmit = async () => {
    if (Object.keys(studentAnswers).length === 0) {
      toast.error("Please answer at least one question before submitting.");
      return;
    }

    setGrading(true);
    try {
      const answersText = quizQuestions
        .map((q) => `Q${q.number}: ${studentAnswers[q.number] || "Not answered"}`)
        .join("\n");

      const rawResult = await evaluateQuiz({
        quizText: result || "",
        studentAnswers: answersText,
      });

      setGradingResult(rawResult);
      setQuizSubmitted(true);
      toast.success("AI has graded your answers!");
    } catch (err) {
      console.error(err);
      toast.error("Grading failed. Please try again.");
    } finally {
      setGrading(false);
    }
  };

  // PDF Export
  const handleDownloadPDF = (item: HistoryItem | { type: string; title: string; content: string }) => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const marginL = 20;
      const contentW = doc.internal.pageSize.getWidth() - 40;
      
      const typeLabel = item.type === "summary" ? "Academic Summary" :
                        item.type === "roadmap" ? "Learning Roadmap" :
                        item.type === "quiz" ? "Practice Quiz" : "Study Flashcards";

      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(typeLabel, marginL, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(220, 240, 255);
      doc.text(`Title: ${item.title}`, marginL, 24);

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      const splitText = doc.splitTextToSize(item.content, contentW);
      doc.text(splitText, marginL, 45);
      doc.save(`ai-hub-${item.type}-${Date.now()}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (pdfErr) {
      console.error(pdfErr);
      toast.error("Failed to export PDF.");
    }
  };

  // Clipboard copy
  const handleCopyClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Copied content to clipboard!");
  };

  // --- ACTIONS FOR HISTORY ITEMS ---

  // 1. View history item
  const handleViewHistoryItem = (item: HistoryItem) => {
    setTaskType(item.type);
    setResult(item.content);
    setError(null);

    setQuizQuestions([]);
    setStudentAnswers({});
    setQuizSubmitted(false);
    setGradingResult(null);

    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    if (item.type === "quiz") {
      const parsed = parseQuizText(item.content);
      setQuizTopic(parsed.topic);
      setQuizQuestions(parsed.questions);
    } else if (item.type === "flashcards") {
      try {
        const cleanJson = item.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
          setFlashcards(parsed);
        }
      } catch (err) {
        console.error(err);
      }
    }
    toast.info(`Viewing ${item.type}: ${item.title}`);
  };

  // 2. Start editing
  const handleStartEditHistoryItem = (item: HistoryItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setIsEditDialogOpen(true);
  };

  // 3. Save Edit to Appwrite Backend
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content cannot be empty.");
      return;
    }

    try {
      if (editingItem.type === "summary" || editingItem.type === "flashcards") {
        await databaseService.updateNote(editingItem.id, {
          topic: editTitle.trim(),
          notesContent: editContent.trim(),
        });
      } else if (editingItem.type === "roadmap") {
        await databaseService.updateRoadmap(editingItem.id, {
          goal: editTitle.trim(),
          roadmapContent: editContent.trim(),
        });
      } else if (editingItem.type === "quiz") {
        await databaseService.updateQuiz(editingItem.id, {
          topic: editTitle.trim(),
          quizContent: editContent.trim(),
        });
      }

      setIsEditDialogOpen(false);
      toast.success("Document updated in Appwrite database!");

      // If currently viewing, update display
      if (result === editingItem.content) {
        setResult(editContent.trim());
        if (editingItem.type === "quiz") {
          const parsed = parseQuizText(editContent.trim());
          setQuizQuestions(parsed.questions);
        } else if (editingItem.type === "flashcards") {
          const cleanJson = editContent.trim().replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          setFlashcards(parsed);
        }
      }

      await loadHistory();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update document.");
    }
  };

  // 4. Delete from Appwrite Backend
  const handleDeleteHistoryItem = async (item: HistoryItem) => {
    const confirmation = window.confirm(`Are you sure you want to delete this ${item.type}? This action is permanent.`);
    if (!confirmation) return;

    try {
      if (item.type === "summary" || item.type === "flashcards") {
        await databaseService.deleteNote(item.id);
      } else if (item.type === "roadmap") {
        await databaseService.deleteRoadmap(item.id);
      } else if (item.type === "quiz") {
        await databaseService.deleteQuiz(item.id);
      }

      toast.success("Document permanently deleted from Appwrite!");

      // Clear viewer if viewing deleted item
      if (result === item.content) {
        setResult(null);
        setQuizQuestions([]);
        setFlashcards([]);
      }

      await loadHistory();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card className="relative overflow-hidden border border-border/80 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/20" />
        <CardHeader className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 text-xs">
                Premium Multimodal Hub
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl font-black">AI Document & PDF Hub</CardTitle>
              <CardDescription className="text-muted-foreground text-sm max-w-xl">
                Upload textbook chapters, classroom slides, or study note screenshots to generate summaries, roadmaps, interactive quizzes, or study flashcards.
              </CardDescription>
            </div>
            {activePlan && (
              <Badge variant="outline" className="h-10 px-4 text-sm font-bold border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 select-none">
                ⚡ {activePlan.aiCredits} AI Credits
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel: Tabs Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex bg-accent/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setSidebarTab("process")}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer ${
                sidebarTab === "process"
                  ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Process File
            </button>
            <button
              onClick={() => setSidebarTab("history")}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer ${
                sidebarTab === "history"
                  ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Saved History ({historyList.length})
            </button>
          </div>

          {/* TAB 1: PROCESS FILE */}
          {sidebarTab === "process" && (
            <div className="space-y-4">
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base font-bold">1. Upload Study Material</CardTitle>
                  <CardDescription>Upload PDF, PNG, JPG, or TXT file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-indigo-500 bg-indigo-500/5"
                        : selectedFile
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border/80 hover:border-indigo-500/50 hover:bg-accent/30"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                    />
                    <div className="space-y-3 flex flex-col items-center">
                      <div className={`p-3 rounded-xl ${selectedFile ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"}`}>
                        <UploadCloud className="h-6 w-6 animate-pulse" />
                      </div>
                      {selectedFile ? (
                        <div>
                          <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-foreground">Drag & drop your file here</p>
                          <p className="text-[10px] text-muted-foreground mt-1">or click to browse files (PDF, PNG, JPG, TXT)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="flex justify-between items-center bg-accent/40 rounded-xl p-2 border border-border/40">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">File Selected</span>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setBase64Data(null);
                          setResult(null);
                        }}
                        className="text-[10px] text-destructive hover:underline font-bold"
                      >
                        Clear File
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base font-bold">2. Select Study Asset</CardTitle>
                  <CardDescription>Generates file using 2 AI Credits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: "summary", label: "Academic Summary", desc: "Detailed chapter summaries, formulas, and key terms.", icon: FileText },
                    { id: "roadmap", label: "Learning Roadmap", desc: "Progressive, structured study milestones & timeline.", icon: Map },
                    { id: "quiz", label: "Practice Quiz Hub", desc: "Generate playable test questions based on the PDF content.", icon: HelpCircle },
                    { id: "flashcards", label: "Interactive Flashcards", desc: "Flippable cards matching active recall studying.", icon: Layers },
                  ].map((task) => {
                    const isActive = taskType === task.id;
                    return (
                      <div
                        key={task.id}
                        onClick={() => setTaskType(task.id as any)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isActive
                            ? "border-indigo-600 bg-indigo-500/5 shadow-sm"
                            : "border-border/60 hover:bg-accent/40"
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-indigo-600 text-white" : "bg-accent text-muted-foreground"}`}>
                          <task.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{task.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{task.desc}</p>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    onClick={handleProcess}
                    disabled={!selectedFile || loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Process Document (2 Credits)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: SAVED HISTORY */}
          {sidebarTab === "history" && (
            <Card className="border border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-bold">Document History</CardTitle>
                <CardDescription>View or manage saved study materials</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {historyLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                      <p className="text-xs text-muted-foreground mt-2">Loading Appwrite logs...</p>
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground space-y-2 select-none">
                      <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs font-bold text-foreground">No documents found</p>
                      <p className="text-[10px] text-muted-foreground/80 leading-normal">
                        Your processed notes and roadmaps will appear here.
                      </p>
                    </div>
                  ) : (
                    historyList.map((item) => (
                      <div
                        key={item.id}
                        className="border border-border/50 rounded-xl p-3 bg-background/55 hover:bg-accent/40 transition-colors space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0 ${
                              item.type === "summary"
                                ? "border-teal-500/20 bg-teal-500/5 text-teal-600 dark:text-teal-400"
                                : item.type === "roadmap"
                                ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                                : item.type === "quiz"
                                ? "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400"
                                : "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                            }`}
                          >
                            {item.type}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-foreground truncate">{item.title}</p>

                        <div className="flex items-center justify-between border-t border-border/40 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistoryItem(item)}
                            className="h-7 text-[10px] px-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-bold gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                          
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditHistoryItem(item)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(item)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteHistoryItem(item)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Render AI Results */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full border border-border/80 shadow-sm flex flex-col min-h-[500px]">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">3. Study Studio</CardTitle>
                  <CardDescription>Generated notes or study screens display below</CardDescription>
                </div>
                {result && !loading && (taskType === "summary" || taskType === "roadmap") && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyClipboard} className="h-8 rounded-lg text-xs gap-1.5 cursor-pointer">
                      <ClipboardCopy className="h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF({ type: taskType, title: selectedFile?.name || "Summary", content: result })} className="h-8 rounded-lg text-xs gap-1.5 cursor-pointer">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
                  <div className="relative flex items-center justify-center mx-auto">
                    <div className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                    <Sparkles className="absolute text-indigo-500 animate-pulse h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground animate-pulse leading-normal">{loadingText}</p>
                </div>
              ) : error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center max-w-md mx-auto space-y-2">
                  <p className="text-xs font-bold text-destructive">Error Processing File</p>
                  <p className="text-[11px] text-destructive/80 leading-normal">{error}</p>
                </div>
              ) : !result ? (
                <div className="text-center py-12 text-muted-foreground space-y-2 max-w-xs mx-auto select-none">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs font-bold text-foreground">Waiting for study material...</p>
                  <p className="text-[10px] text-muted-foreground/80 leading-normal">
                    Upload your document on the left or select an item from your Saved History to review it here.
                  </p>
                </div>
              ) : (
                /* Main Result Viewer */
                <div className="flex-1 flex flex-col">
                  {/* --- TASK: SUMMARY OR ROADMAP --- */}
                  {(taskType === "summary" || taskType === "roadmap") && (
                    <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground bg-accent/20 rounded-xl p-4 border border-border/40 max-h-[500px] overflow-y-auto">
                      {result}
                    </div>
                  )}

                  {/* --- TASK: INTERACTIVE QUIZ --- */}
                  {taskType === "quiz" && quizQuestions.length > 0 && (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Quiz Active: {quizTopic}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Answer the questions below to test your topic comprehension.</p>
                      </div>

                      <div className="space-y-4">
                        {quizQuestions.map((question) => (
                          <div key={question.number} className="border border-border/50 rounded-xl p-4 bg-background/50 space-y-3">
                            <p className="text-xs font-black text-foreground">Q{question.number}. {question.text}</p>
                            
                            {question.type === "mcq" && question.options.length > 0 ? (
                              <div className="grid gap-2">
                                {question.options.map((opt, oIdx) => {
                                  const optionLetter = opt.trim().charAt(0);
                                  const isSelected = studentAnswers[question.number] === optionLetter;
                                  return (
                                    <div
                                      key={oIdx}
                                      onClick={() => !quizSubmitted && setStudentAnswers({ ...studentAnswers, [question.number]: optionLetter })}
                                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                        isSelected
                                          ? "border-indigo-600 bg-indigo-500/5 font-bold"
                                          : "border-border/60 hover:bg-accent/40"
                                      } ${quizSubmitted ? "pointer-events-none opacity-80" : ""}`}
                                    >
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-muted-foreground/40"}`}>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <textarea
                                value={studentAnswers[question.number] || ""}
                                onChange={(e) => !quizSubmitted && setStudentAnswers({ ...studentAnswers, [question.number]: e.target.value })}
                                placeholder="Type your answer here..."
                                disabled={quizSubmitted}
                                className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {!quizSubmitted ? (
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={grading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 cursor-pointer"
                        >
                          {grading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              AI Grading Answers...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Submit Answers & Evaluate with AI
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-4 border-t border-border/60 pt-4">
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 text-xs">
                            Evaluation Completed
                          </Badge>
                          {gradingResult && (
                            <div className="whitespace-pre-line text-xs bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 leading-relaxed text-foreground">
                              {gradingResult}
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => {
                              setQuizSubmitted(false);
                              setStudentAnswers({});
                              setGradingResult(null);
                            }}
                            className="w-full rounded-xl cursor-pointer"
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retake Quiz
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- TASK: INTERACTIVE FLASHCARDS --- */}
                  {taskType === "flashcards" && flashcards.length > 0 && (
                    <div className="space-y-6 flex flex-col items-center">
                      <div className="w-full text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active Recall Cards</span>
                        <div className="w-full bg-accent/40 h-1.5 rounded-full overflow-hidden mt-2 border border-border/30">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1.5">
                          Card {currentCardIndex + 1} of {flashcards.length}
                        </p>
                      </div>

                      <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="relative w-full max-w-md h-60 cursor-pointer select-none"
                        style={{ perspective: "1000px" }}
                      >
                        <div
                          className="w-full h-full transition-transform duration-500"
                          style={{
                            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            transformStyle: "preserve-3d",
                          }}
                        >
                          {/* Card Front */}
                          <div
                            className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-850 p-6 rounded-2xl border border-indigo-200/40 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-md"
                            style={{
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                            }}
                          >
                            <Badge variant="outline" className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[9px] mb-3">
                              Question / Term
                            </Badge>
                            <p className="text-sm sm:text-base font-bold text-foreground leading-snug">
                              {flashcards[currentCardIndex].front}
                            </p>
                            <span className="text-[10px] text-muted-foreground/85 mt-6 animate-pulse uppercase tracking-wider">
                              Click to Flip
                            </span>
                          </div>

                          {/* Card Back */}
                          <div
                            className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-zinc-900 dark:to-zinc-850 p-6 rounded-2xl border border-purple-200/40 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-md"
                            style={{
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              transform: "rotateY(180deg)",
                            }}
                          >
                            <Badge variant="outline" className="border-purple-500/20 text-purple-600 dark:text-purple-400 uppercase tracking-widest text-[9px] mb-3">
                              Answer / Definition
                            </Badge>
                            <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                              {flashcards[currentCardIndex].back}
                            </p>
                            <span className="text-[10px] text-muted-foreground/85 mt-6 uppercase tracking-wider">
                              Click to Flip Back
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={currentCardIndex === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(false);
                            setTimeout(() => {
                              setCurrentCardIndex(currentCardIndex - 1);
                            }, 150);
                          }}
                          className="rounded-full h-10 w-10 border-border/80 cursor-pointer"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={currentCardIndex === flashcards.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(false);
                            setTimeout(() => {
                              setCurrentCardIndex(currentCardIndex + 1);
                            }, 150);
                          }}
                          className="rounded-full h-10 w-10 border-border/80 cursor-pointer"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Edit Study Document</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the title and detailed generated text content saved in Appwrite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Document Title / Goal</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Detailed Content</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[250px] font-mono text-foreground leading-relaxed"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl text-xs h-9 cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9 cursor-pointer">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
