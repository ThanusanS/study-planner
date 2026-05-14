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



Q2. <question>
A) ...
B) ...
C) ...
D) ...

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
Your Answer: ...
Correct Answer: ...
Result: Correct / Wrong / Partially Correct
Explanation: ...

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
- DO NOT use ** or __ for bold/emphasis. Use plain text only
- Format emphasis by using ALL CAPS or simple punctuation like colons and dashes

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const callAIProvider = async (content: string) => {
  const geminiApiKey = getGeminiConfig();

  if (geminiApiKey && geminiApiKey.trim() !== "") {
    // Use Official direct Gemini API — try multiple models to handle per-model rate limits
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    let lastError: unknown = null;

    for (let i = 0; i < GEMINI_MODELS.length; i++) {
      const modelName = GEMINI_MODELS[i];
      try {
        console.log(`Trying Gemini model: ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: content }] }],
        });

        return result.response.text();
      } catch (error) {
        lastError = error;
        console.warn(
          `Failed with ${modelName}${i < GEMINI_MODELS.length - 1 ? `, trying ${GEMINI_MODELS[i + 1]}...` : " (last model)"}`,
          error,
        );
        // Small delay before trying the next model to avoid rapid-fire requests
        if (i < GEMINI_MODELS.length - 1) {
          await delay(2000);
        }
      }
    }

    // All Gemini models failed — check if OpenRouter is available before throwing
    const { apiKey: orKey } = getOpenRouterConfig();
    if (!orKey) {
      throw lastError || new Error("All Gemini models failed due to rate limits. Please wait a minute and try again.");
    }
    console.warn("All Gemini models rate-limited, falling back to OpenRouter...");
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
