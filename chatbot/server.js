// server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check API key
if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file.");
  process.exit(1);
}

// Create uploads directory if not exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup
const upload = multer({ dest: uploadDir + "/" });

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Gemini setup
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", models: MODELS });
});

// Chat endpoint
app.post("/api/chat", upload.single("image"), async (req, res) => {
  const userText = req.body.text?.trim() || "Hello!";
  const file = req.file;
  let responseText = "";
  let errorLast = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      let result;
      if (file) {
        // Read image and convert to base64
        const imageData = fs.readFileSync(file.path);
        const base64 = imageData.toString("base64");

        result = await model.generateContent([
          {
            role: "user",
            parts: [
              { text: userText },
              { inlineData: { mimeType: file.mimetype, data: base64 } },
            ],
          },
        ]);
        fs.unlinkSync(file.path);
      } else {
        // Text only
        result = await model.generateContent([{ text: userText }]);
      }

      // Extract text response safely
      responseText =
        result?.response?.text?.() ||
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "✅ Got your query!";
      break; // success, exit loop
    } catch (err) {
      console.warn(`⚠️ Model ${modelName} failed:`, err.message);
      errorLast = err;
      continue;
    }
  }

  if (!responseText) {
    console.error("❌ Gemini API Error:", errorLast?.message);
    return res.status(500).json({
      answer:
        errorLast?.response?.data?.error?.message ||
        "⚠️ Gemini API Error. Please try again later.",
    });
  }

  res.json({ answer: responseText });
});

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
