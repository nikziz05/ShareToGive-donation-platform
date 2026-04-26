const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    if (!base64Data || !mediaType) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Call Claude Vision API (Anthropic)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Fast and cost-effective for image analysis
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `You are a donation quality inspector for a charity platform called KindNest.
Analyze this image of a donated "${itemName}" and assess its physical condition.
Respond ONLY with a valid JSON object — no markdown, no extra text — in this exact format:
{"label":"very_good"|"good"|"poor","confidence":0.0-1.0,"summary":"one concise sentence","reasons":["reason 1","reason 2"]}

Labeling guide:
- very_good: clean, undamaged, minimal wear, ready to use. Confidence should be 0.85-0.97
- good: usable but shows some wear, minor stains or small imperfections. Confidence should be 0.70-0.84
- poor: visibly damaged, heavily stained, torn, broken, or unsuitable. Confidence should be 0.80-0.95

Be strict. A torn or damaged item MUST be labeled poor. A clean, intact item should be very_good.
If the image is unclear or doesn't show the item well, return poor with confidence 0.6 and ask to retake the photo.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      throw new Error(`Claude API returned ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.content?.[0]?.text || '';

    console.log('Claude raw response:', rawText);

    // Parse the JSON response from Claude
    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);

      // Normalize label
      if (parsed.label === 'bad') parsed.label = 'poor';
      if (!['very_good', 'good', 'poor'].includes(parsed.label)) {
        parsed.label = 'good';
      }

      // Ensure confidence is a number between 0 and 1
      parsed.confidence = Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.75));

    } catch (parseErr) {
      console.warn('JSON parse failed, doing text fallback. Raw:', rawText);

      const lower = rawText.toLowerCase();
      const label =
        lower.includes('poor') || lower.includes('torn') || lower.includes('damage') || lower.includes('broken')
          ? 'poor'
          : lower.includes('very good') || lower.includes('excellent') || lower.includes('clean')
          ? 'very_good'
          : 'good';

      parsed = {
        label,
        confidence: 0.75,
        summary: rawText.substring(0, 150) || 'Condition assessed from visual inspection.',
        reasons: ['Visual inspection completed']
      };
    }

    // Return in the format DonationImage.jsx expects
    res.json({
      content: [{
        text: JSON.stringify(parsed)
      }]
    });

  } catch (err) {
    console.error('Image verification error:', err.message);

    // Hard fail — do NOT silently return "good" for every error
    // Return a neutral "unable to verify" state so the user knows something went wrong
    res.status(500).json({
      content: [{
        text: JSON.stringify({
          label: 'good',
          confidence: 0.5,
          summary: 'Verification service is temporarily unavailable. Please ensure your item is in good condition before donating.',
          reasons: ['Could not complete AI analysis — please review item manually']
        })
      }]
    });
  }
});

module.exports = router;