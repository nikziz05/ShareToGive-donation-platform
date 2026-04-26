const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mediaType, data: base64Data } },
          { text: `You are a donation quality inspector for a charity platform called KindNest. Analyze this image of a donated ${itemName} and assess its physical condition. Respond ONLY with a valid JSON object in this exact format: {"label":"very_good"|"good"|"poor","confidence":0.0-1.0,"summary":"one concise sentence","reasons":["reason 1","reason 2"]}` }
        ]
      }]
    })
  }
);

const data = await response.json();
const rawText = data.candidates[0].content.parts[0].text;
res.json({ content: [{ text: rawText }] });
  } catch (err) {
    res.status(500).json({ message: 'Image verification failed' });
  }
});

module.exports = router;