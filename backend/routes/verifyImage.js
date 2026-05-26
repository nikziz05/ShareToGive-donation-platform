const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    console.log('=== VERIFY IMAGE START ===');
    console.log('Item:', itemName);
    console.log('GROQ key exists:', !!process.env.GROQ_API_KEY);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64Data}`
                }
              },
              {
                type: 'text',
                text: `You are a donation quality inspector for a charity platform called ShareToGive.
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
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      })
    });

    console.log('Groq response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', response.status, errText);
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
    const rawText = data?.choices?.[0]?.message?.content || '';
    console.log('Groq raw response:', rawText);

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

    console.log('Final result:', parsed.label, parsed.confidence);
    console.log('=== VERIFY IMAGE END ===');

    res.json({
      content: [{ text: JSON.stringify(parsed) }]
    });

  } catch (err) {
    console.error('Image verification error:', err);
    res.status(500).json({ message: 'Image verification failed: ' + err.message });
  }
});

module.exports = router;