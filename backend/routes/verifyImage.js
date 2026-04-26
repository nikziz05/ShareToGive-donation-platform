const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper: convert base64 to Buffer for Hugging Face
function base64ToBuffer(base64Data) {
  return Buffer.from(base64Data, 'base64');
}

// Helper: classify condition from VQA answers
function classifyCondition(answers, itemName) {
  const allText = answers.join(' ').toLowerCase();

  const poorKeywords = [
    'torn', 'damaged', 'broken', 'dirty', 'stained', 'worn out',
    'ripped', 'hole', 'holes', 'deteriorated', 'unusable', 'bad',
    'poor', 'ruined', 'filthy', 'tattered', 'shredded', 'cracked'
  ];

  const goodKeywords = [
    'clean', 'good', 'nice', 'decent', 'usable', 'intact',
    'fine', 'okay', 'acceptable', 'fair'
  ];

  const veryGoodKeywords = [
    'excellent', 'perfect', 'new', 'brand new', 'pristine',
    'great', 'very good', 'like new', 'mint'
  ];

  let poorScore = 0;
  let goodScore = 0;
  let veryGoodScore = 0;

  poorKeywords.forEach(kw => { if (allText.includes(kw)) poorScore += 2; });
  goodKeywords.forEach(kw => { if (allText.includes(kw)) goodScore += 1; });
  veryGoodKeywords.forEach(kw => { if (allText.includes(kw)) veryGoodScore += 2; });

  if (poorScore > 0) {
    return {
      label: 'poor',
      confidence: Math.min(0.95, 0.70 + poorScore * 0.05),
      summary: `The ${itemName} appears to be in poor condition — signs of damage or wear detected.`,
      reasons: answers.filter(a => poorKeywords.some(kw => a.toLowerCase().includes(kw))).slice(0, 2)
        .concat(['Item may not meet donation quality standards'])
    };
  } else if (veryGoodScore > goodScore) {
    return {
      label: 'very_good',
      confidence: Math.min(0.95, 0.80 + veryGoodScore * 0.04),
      summary: `The ${itemName} appears to be in excellent condition and ready for donation.`,
      reasons: ['Item looks clean and well-maintained', 'No visible damage detected']
    };
  } else {
    return {
      label: 'good',
      confidence: 0.75,
      summary: `The ${itemName} appears to be in acceptable condition for donation.`,
      reasons: ['Item shows minor wear but is still usable', 'Meets basic donation standards']
    };
  }
}

router.post('/', auth, async (req, res) => {
  try {
    const { base64Data, mediaType, itemName } = req.body;

    if (!base64Data || !mediaType) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const HF_TOKEN = process.env.HF_TOKEN;

    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN not configured');
    }

    // Ask multiple visual questions about the item condition
    const questions = [
      `Is this ${itemName} torn or damaged?`,
      `Is this ${itemName} clean or dirty?`,
      `What is the overall condition of this ${itemName}?`,
      `Is this ${itemName} suitable for donation?`
    ];

    console.log(`Analyzing image for: ${itemName}`);

    // Use BLIP VQA model — free on Hugging Face
    const vqaResults = await Promise.all(
      questions.map(async (question) => {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/Salesforce/blip-vqa-base',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: {
                image: base64Data,
                question: question
              }
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`VQA question failed (${response.status}): ${question}`, errText);
          return null;
        }

        const data = await response.json();
        const answer = Array.isArray(data) ? data[0]?.answer : data?.answer;
        console.log(`Q: "${question}" -> A: "${answer}"`);
        return answer || null;
      })
    );

    const validAnswers = vqaResults.filter(Boolean);
    console.log('Valid answers:', validAnswers);

    if (validAnswers.length === 0) {
      throw new Error('No valid answers from VQA model');
    }

    const result = classifyCondition(validAnswers, itemName);

    res.json({
      content: [{
        text: JSON.stringify(result)
      }]
    });

  } catch (err) {
    console.error('Image verification error:', err.message);

    const isLoading = err.message?.includes('loading') || err.message?.includes('503');

    res.status(500).json({
      content: [{
        text: JSON.stringify({
          label: 'good',
          confidence: 0.5,
          summary: isLoading
            ? 'AI model is warming up. Please click Retry in a few seconds.'
            : 'Verification temporarily unavailable. Please ensure your item is in good condition.',
          reasons: [isLoading ? 'Model is loading — retry in 10 seconds' : 'Manual review recommended']
        })
      }]
    });
  }
});

module.exports = router;