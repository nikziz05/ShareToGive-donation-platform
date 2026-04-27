const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType, data: base64Data } },
              {
                text: `You are a donation quality inspector for a charity platform called KindNest.
Analyze this image of a donated "${itemName}" and assess its physical condition.
Respond ONLY with a valid JSON object — no markdown, no extra text — in this exact format:
{"label":"very_good"|"good"|"poor","confidence":0.0-1.0,"summary":"one concise sentence","reasons":["reason 1","reason 2"]}

Labeling guide:
- very_good: clean, undamaged, minimal wear, ready to use
- good: usable but shows some wear, minor stains or small imperfections
- poor: visibly damaged, heavily stained, torn, broken, or unsuitable

If the image is unclear or doesn't show the item well, return poor with a note to retake the photo.`
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.json({
        content: [{
          text: JSON.stringify({
            label: 'good',
            confidence: 0.7,
            summary: 'Could not fully analyze the image. Please ensure item is in good condition.',
            reasons: ['Image analysis unavailable — manual review recommended']
          })
        }]
      });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Gemini raw response:', rawText);

    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
      if (parsed.label === 'bad') parsed.label = 'poor';
      if (!['very_good', 'good', 'poor'].includes(parsed.label)) {
        parsed.label = 'good';
      }
    } catch {
      const lower = rawText.toLowerCase().trim();
      const label = (lower.includes('bad') || lower.includes('poor') ||
                     lower.includes('damage') || lower.includes('torn') ||
                     lower.includes('broken') || lower.includes('unsuitable'))
        ? 'poor'
        : lower.includes('very good') || lower.includes('excellent')
          ? 'very_good'
          : 'good';

      parsed = {
        label,
        confidence: 0.8,
        summary: rawText.substring(0, 150) || 'Condition assessed from visual inspection.',
        reasons: ['Assessment based on overall visual appearance']
      };
    }

    res.json({
      content: [{ text: JSON.stringify(parsed) }]
    });

  } catch (err) {
    console.error('Image verification error:', err);
    res.status(500).json({ message: 'Image verification failed: ' + err.message });
  }
});

module.exports = router;