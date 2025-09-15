// 👇 Already existing imports
import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config(); 
const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json()); // ✅ Required for parsing JSON body from frontend

// 🔑 OpenAI setup
const openai = new OpenAI({
  apiKey:process.env.OPENAI_API_KEY, // Move this to .env in production
});

// 🔹 Pest detection route (existing)
app.post("/detect", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = fs.readFileSync(req.file.path);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in crop pest detection. Identify the pest in the image and suggest eco-friendly farming solutions.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this crop image for pest detection." },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
            },
          ],
        },
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// 🔹 🆕 Chatbot route
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "You are a helpful smart farming advisor for Indian farmers." },
        { role: "user", content: message },
      ],
    });

    // 👇 Debugging log
    console.log("OpenAI response:", JSON.stringify(response, null, 2));

    const reply = response.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No reply from OpenAI" });
    }

    res.json({ result: reply });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// 🔹 Start server
app.listen(5000, () => console.log("🚀 Backend running at http://localhost:5000"));
