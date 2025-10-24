import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hi!");
    console.log("✅ Response:", result.response.text());
  } catch (err) {
    console.error("❌ Gemini Error:", err.message || err);
  }
}

test();
