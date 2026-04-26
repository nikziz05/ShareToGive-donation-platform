const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,   // kept secret on server
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: `You are a donation quality inspector for a charity platform called KindNest.Analyze this image of a donated ${itemName} and assess its physical condition.Respond ONLY with a valid JSON object — no markdown, no extra text — in this exact format:{"label":"very_good"|"good"|"poor","confidence":0.0-1.0,"summary":"one concise sentence","reasons":["reason 1","reason 2"]}Labeling guide:- very_good: clean, undamaged, minimal wear, ready to use- good: usable but shows some wear, minor stains or small imperfections  - poor: visibly damaged, heavily stained, torn, broken, or unsuitable.If the image is unclear or doesn't show the item well,return poor with a note to retake the photo.`
              }
          ]
        }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Image verification failed' });
  }
});

module.exports = router;