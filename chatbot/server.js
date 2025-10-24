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

// Updated model names (v2.5)
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-8b", "gemini-2.5-pro"];

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", models: MODELS });
});

// Keywords related to bike, vehicle, and service
const ALLOWED_KEYWORDS = [
  "bike", "motorbike", "motorcycle", "scooter", "vehicle", "car", "engine", "service",
  "repair", "maintenance", "garage", "brake", "oil", "battery", "tyre", "mechanic",
  "wash", "insurance", "pickup", "drop", "service center", "bike service", "vehicle issue",
  "bike repair", "two wheeler", "motor", "spare parts", "engine oil", "chain", "helmet"
];

// Helper function to check if text is related to vehicle/bike context
function isVehicleRelated(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return ALLOWED_KEYWORDS.some(word => lower.includes(word));
}

// Chat endpoint
app.post("/api/chat", upload.single("image"), async (req, res) => {
  const userText = req.body.text?.trim() || "";

  // 🔒 Check if query is vehicle/bike/service related
  if (!isVehicleRelated(userText)) {
    return res.json({
      answer:
        "🚫 Sorry, I can only help you with bike, vehicle, or service-related queries."
    });
  }

  const file = req.file;
  let responseText = "";
  let errorLast = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      let result;
      if (file) {
        // Read and encode image
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
        result = await model.generateContent([{ text: userText }]);
      }

      // Extract text safely
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
