import { GoogleGenerativeAI } from "@google/generative-ai";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are an advanced AI Educational Tutor and Quiz Evaluation Engine.

Your job is to create quizzes and evaluate student answers like a real teacher.

You must support two modes:

================================================
MODE 1: QUIZ GENERATION
================================================
If the user asks to generate a quiz:

- Generate high-quality exam-style questions based on the given topic.
- Support MCQ and short-answer questions.
- Ensure questions are clear, simple, and suitable for learning.
- Cover basic to advanced concepts depending on difficulty level.
- Do NOT show answers in this mode.
- Format output clearly and structured.

Output format:
Quiz Topic: <topic>

Q1. <question>
A) ...
B) ...
C) ...
D) ...

Q2. ...

================================================
MODE 2: ANSWER EVALUATION
================================================
If the user provides answers:

- Evaluate each answer carefully.
- Compare with correct concept (internal reasoning only).
- Be strict but fair like a real teacher.
- Allow partial marks if answer is partially correct.

You must return:

1. Score (out of total marks)
2. Question-by-question evaluation
3. Correct answers
4. Short explanation for each answer
5. Feedback on weak areas
6. Study improvement suggestions

Output format:

Score: X / Y

Q1:
Your Answer: ...
Correct Answer: ...
Result: Correct / Wrong / Partially Correct
Explanation: ...

Q2:
...

Final Feedback:
- Strengths: ...
- Weak Areas: ...
- Study Suggestion: ...

================================================
RULES
================================================
- Be accurate and consistent in marking
- Do not be overly strict or overly lenient
- Use simple English
- Act like a professional teacher and AI examiner
- Never reveal hidden reasoning steps
- Always keep response structured and clean
- Focus on learning improvement

You are part of a Study AI system that helps students learn effectively through quizzes and evaluation.`;

type GenerateQuizInput = {
  topic: string;
  difficulty: string;
  questionCount: number;
  questionType: "mcq" | "short" | "mixed";
};

type EvaluateQuizInput = {
  quizText: string;
  studentAnswers: string;
};

const getOpenRouterConfig = () => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  const model =
    (import.meta.env.VITE_OPENROUTER_MODEL as string | undefined) ||
    "google/gemma-4-26b-a4b-it:free";

  return { apiKey, model };
};

const getGeminiConfig = () => {
  return import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
};

const callAIProvider = async (content: string) => {
  const geminiApiKey = getGeminiConfig();

  if (geminiApiKey && geminiApiKey.trim() !== "") {
    // Use Official direct Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: content }] }],
      });

      return result.response.text();
    } catch (error) {
      console.warn(
        "Failed with gemini-2.5-flash, trying gemini-1.5-flash-latest...",
        error,
      );

      // Fallback to older gemini if gemini-2.5-flash errors out
      const workingModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await workingModel.generateContent({
        contents: [{ role: "user", parts: [{ text: content }] }],
      });

      return result.response.text();
    }
  }

  // Fallback to OpenRouter
  const { apiKey, model } = getOpenRouterConfig();
  if (!apiKey) {
    throw new Error("No Gemini API key or OpenRouter API key found in .env");
  }

  const referer =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "Study Planner AI Quiz",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OpenRouter request failed");
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content as string;
};

export const generateQuiz = async (input: GenerateQuizInput) => {
  const prompt = `Generate a quiz using the following settings:
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Question Count: ${input.questionCount}
Question Types: ${input.questionType === "mixed" ? "MCQ and short-answer" : input.questionType.toUpperCase()}

Remember: Do not include answers in quiz generation mode.`;

  return await callAIProvider(prompt);
};

export const evaluateQuiz = async (input: EvaluateQuizInput) => {
  const prompt = `Evaluate the student's answers.

Quiz:
${input.quizText}

Student Answers:
${input.studentAnswers}

Return the evaluation using the required output format.`;

  return await callAIProvider(prompt);
};
