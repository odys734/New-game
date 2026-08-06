var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/gemini/generate-level", async (req, res) => {
    try {
      const { theme, difficulty, energyTypes } = req.body;
      const ai = getGenAI();
      const prompt = `Generate a single-screen 2.5D physics puzzle level for "Liquid Logic: Energy Flow".
Level Specs:
- Theme: ${theme || "Cyberpunk Laboratory"}
- Difficulty: Level ${difficulty || 1} (out of 10)
- Allowed Energy Types: ${JSON.stringify(energyTypes || ["aqua", "plasma"])}

The canvas coordinate bounds are X: 0 to 800, Y: 0 to 600.
Energy source drops spawn near top (e.g. Y: 80 to 150).
Energy container targets are placed near bottom/middle (e.g. Y: 450 to 550, width: 90, height: 110, targetCount: 15-25 drops).
Include 2 to 6 interactive obstacles like ramps, portals, rotating platforms, fans, lasers, mirrors, magnets, switches, or breakable barriers.
Ensure the layout is logically solvable by drawing ONE continuous line.

Return ONLY JSON adhering strictly to this format:
{
  "id": "ai_level_${Date.now()}",
  "title": "Short Creative Name",
  "worldId": 1,
  "levelNumber": 100,
  "theme": "Cyberpunk Laboratory",
  "description": "Short puzzle tagline",
  "energyType": "aqua",
  "dropCount": 25,
  "dropSpawn": { "x": 400, "y": 90 },
  "containers": [
    { "id": "c1", "x": 400, "y": 480, "width": 90, "height": 110, "targetCount": 20, "requiredType": "aqua" }
  ],
  "obstacles": [
    {
      "id": "obs1",
      "type": "ramp",
      "x": 300,
      "y": 280,
      "width": 180,
      "height": 20,
      "rotation": 0.3,
      "isStatic": true
    }
  ],
  "parLineLength": 450,
  "hintText": "Strategic clue on how to funnel the drops."
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const rawText = response.text || "{}";
      const levelData = JSON.parse(rawText);
      res.json({ success: true, level: levelData });
    } catch (err) {
      console.error("Error generating level via Gemini:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to generate AI level"
      });
    }
  });
  app.post("/api/gemini/hint", async (req, res) => {
    try {
      const { levelData, playerAttempt } = req.body;
      const ai = getGenAI();
      const prompt = `You are the master puzzle hint advisor for the mobile game "Liquid Logic: Energy Flow".
Level Title: "${levelData?.title || "Unknown Level"}"
Description: "${levelData?.description || ""}"
Energy Type: "${levelData?.energyType || "aqua"}"
Obstacles: ${JSON.stringify(levelData?.obstacles || [])}
Containers: ${JSON.stringify(levelData?.containers || [])}
Player Attempt Stats: ${JSON.stringify(playerAttempt || {})}

Provide progressive 3-tiered hints that DO NOT immediately spoil the puzzle:
Tier 1: High-level directional clue (where to guide the energy flow).
Tier 2: Specific mechanics/obstacle interaction tip (e.g. how to use portals, lasers, or plasma).
Tier 3: Concrete drawing trajectory blueprint advice (e.g. "Draw a smooth U-shaped curve under the left rotator extending up to the portal").

Return JSON:
{
  "tier1": "string",
  "tier2": "string",
  "tier3": "string"
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const rawText = response.text || "{}";
      const hintData = JSON.parse(rawText);
      res.json({ success: true, hints: hintData });
    } catch (err) {
      console.error("Error fetching hint via Gemini:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to generate AI hints"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Liquid Logic Server] Running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
