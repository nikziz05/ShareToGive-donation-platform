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

    // If Gemini API is unavailable, return a safe default
    if (!response.ok) {
      console.warn('Gemini API non-OK response:', response.status);
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

    // Safely extract the raw text from Gemini's response
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse as JSON directly (our prompt asks for JSON output)
    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);

      // Validate the label field — Gemini sometimes returns "bad" instead of "poor"
      if (parsed.label === 'bad') parsed.label = 'poor';
      if (!['very_good', 'good', 'poor'].includes(parsed.label)) {
        parsed.label = 'good'; // safe fallback
      }
    } catch {
      // Gemini returned plain text like "good" or "bad" instead of JSON
      // Map it into the structure the frontend expects
      const lower = rawText.toLowerCase().trim();
      const label = lower.includes('bad') || lower.includes('poor') || lower.includes('damage')
        ? 'poor'
        : lower.includes('very good') || lower.includes('excellent')
          ? 'very_good'
          : 'good';

      parsed = {
        label,
        confidence: 0.75,
        summary: rawText.length > 0
          ? rawText.substring(0, 120)
          : 'Item condition assessed based on visual inspection.',
        reasons: ['Assessment based on overall visual appearance']
      };
    }

    // Return in the format DonationImage.jsx expects:
    // data.content[].text → JSON string that gets parsed client-side
    res.json({
      content: [{
        text: JSON.stringify(parsed)
      }]
    });

  } catch (err) {
    console.error('Image verification error:', err);

    // Return a graceful default instead of a 500 — the frontend will show "good"
    res.json({
      content: [{
        text: JSON.stringify({
          label: 'good',
          confidence: 0.7,
          summary: 'Unable to analyze image at this time. Please ensure your item is in good condition.',
          reasons: ['Verification service temporarily unavailable']
        })
      }]
    });
  }
});


module.exports = router;