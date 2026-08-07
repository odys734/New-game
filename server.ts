import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini API client safely with telemetry header
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: AI Level Generation & Validation
  app.post('/api/gemini/generate-level', async (req, res) => {
    try {
      const { theme, difficulty, energyTypes } = req.body;

      // Validate input
      if (!theme && !difficulty && !energyTypes) {
        return res.status(400).json({
          success: false,
          error: 'At least one parameter (theme, difficulty, or energyTypes) is required',
        });
      }

      const ai = getGenAI();

      const prompt = `Generate a single-screen 2.5D physics puzzle level for "Liquid Logic: Energy Flow".
Level Specs:
- Theme: ${theme || 'Cyberpunk Laboratory'}
- Difficulty: Level ${difficulty || 1} (out of 10)
- Allowed Energy Types: ${JSON.stringify(energyTypes || ['aqua', 'plasma'])}

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
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      
      if (!rawText || rawText.trim() === '{}') {
        return res.status(500).json({
          success: false,
          error: 'Empty response from Gemini API',
        });
      }

      const levelData = JSON.parse(rawText);
      res.json({ success: true, level: levelData });
    } catch (err: any) {
      console.error('Error generating level via Gemini:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate AI level',
      });
    }
  });

  // API Route: AI Progressive Multi-Tier Hint
  app.post('/api/gemini/hint', async (req, res) => {
    try {
      const { levelData, playerAttempt } = req.body;

      // Validate input
      if (!levelData) {
        return res.status(400).json({
          success: false,
          error: 'levelData is required in request body',
        });
      }

      const ai = getGenAI();

      const prompt = `You are the master puzzle hint advisor for the mobile game "Liquid Logic: Energy Flow".
Level Title: "${levelData?.title || 'Unknown Level'}"
Description: "${levelData?.description || ''}"
Energy Type: "${levelData?.energyType || 'aqua'}"
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
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';

      if (!rawText || rawText.trim() === '{}') {
        return res.status(500).json({
          success: false,
          error: 'Empty response from Gemini API',
        });
      }

      const hintData = JSON.parse(rawText);
      res.json({ success: true, hints: hintData });
    } catch (err: any) {
      console.error('Error fetching hint via Gemini:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate AI hints',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Liquid Logic Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
