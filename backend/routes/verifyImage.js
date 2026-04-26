const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType, data: base64Data } },
              {
                text: `You are a donation quality inspector for a charity platform. Analyze this image of "${itemName}" and determine if it is in good, acceptable condition for donation. Respond with a single word: either "good" if the item appears clean and usable, or "bad" if it appears damaged, dirty, or unusable.`
              }
            ]
          }]
        })
      }
    );

    // If Gemini API returns a non-OK response, default to "good"
    if (!response.ok) {
      return res.json({ content: [{ text: 'good' }] });
    }

    const data = await response.json();

    // Safely extract text, fallback to "good" if response is malformed
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'good';

    res.json({ content: [{ text: rawText }] });

  } catch (err) {
    console.error('Image verification error:', err);
    // Default to "good" instead of returning a 500 error
    res.json({ content: [{ text: 'good' }] });
  }
});

module.exports = router;