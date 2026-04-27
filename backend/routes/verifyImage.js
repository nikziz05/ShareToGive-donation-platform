const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

function classifyCondition(answers, itemName) {
  const allText = answers.join(' ').toLowerCase();

  const poorKeywords = [
    'torn', 'damaged', 'broken', 'dirty', 'stained', 'worn out',
    'ripped', 'hole', 'holes', 'deteriorated', 'unusable', 'bad',
    'poor', 'ruined', 'filthy', 'tattered', 'shredded', 'cracked',
    'yes' // "Is it torn?" -> "yes" = poor
  ];

  const veryGoodKeywords = [
    'excellent', 'perfect', 'new', 'brand new', 'pristine',
    'great', 'very good', 'like new', 'mint', 'clean', 'no'
    // "Is it torn?" -> "no" = good sign
  ];

  const goodKeywords = [
    'good', 'nice', 'decent', 'usable', 'intact',
    'fine', 'okay', 'acceptable', 'fair'
  ];

  let poorScore = 0;
  let goodScore = 0;
  let veryGoodScore = 0;

  poorKeywords.forEach(kw => { if (allText.includes(kw)) poorScore += 2; });
  goodKeywords.forEach(kw => { if (allText.includes(kw)) goodScore += 1; });
  veryGoodKeywords.forEach(kw => { if (allText.includes(kw)) veryGoodScore += 1; });

  if (poorScore >= 4) {
    return {
      label: 'poor',
      confidence: Math.min(0.95, 0.70 + poorScore * 0.03),
      summary: `The ${itemName} appears to be in poor condition — signs of damage or wear detected.`,
      reasons: ['Damage or deterioration detected in image', 'Item may not meet donation quality standards']
    };
  } else if (veryGoodScore > goodScore && poorScore === 0) {
    return {
      label: 'very_good',
      confidence: Math.min(0.93, 0.80 + veryGoodScore * 0.03),
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

async function askVQA(base64Data, mediaType, question, hfToken) {
  // Correct Hugging Face Inference API endpoint for BLIP VQA
  // Image must be sent as binary, question as query param
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const response = await fetch(
    `https://api-inference.huggingface.co/models/Salesforce/blip-vqa-base`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': mediaType || 'image/jpeg',
        'X-Wait-For-Model': 'true'  // Wait instead of 503 if model is loading
      },
      // For BLIP VQA, send raw image bytes with question in a special way
      // Actually BLIP VQA via HF Inference API needs JSON with inputs object
      body: JSON.stringify({
        inputs: {
          image: base64Data,
          question: question
        }
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.warn(`VQA failed (${response.status}) for: "${question}"`);
    console.warn('Response:', text.substring(0, 200));
    return null;
  }

  const data = await response.json();
  console.log(`Q: "${question}" -> Raw:`, JSON.stringify(data).substring(0, 100));

  // HF returns [{answer, score}, ...] or {answer}
  if (Array.isArray(data) && data[0]?.answer) return data[0].answer;
  if (data?.answer) return data.answer;
  if (typeof data === 'string') return data;
  return null;
}

async function askVQAv2(base64Data, mediaType, question, hfToken) {
  // Alternative: Use google/vit-base-patch16-224 for image classification
  // or use a different approach with BLIP image captioning (no question needed)
  const response = await fetch(
    'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': mediaType || 'image/jpeg',
        'X-Wait-For-Model': 'true'
      },
      body: Buffer.from(base64Data, 'base64')  // Send raw image bytes for captioning
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.warn(`Captioning failed (${response.status}):`, text.substring(0, 200));
    return null;
  }

  const data = await response.json();
  console.log('Caption result:', JSON.stringify(data).substring(0, 150));

  // Returns [{generated_text: "..."}]
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
  if (data?.generated_text) return data.generated_text;
  return null;
}

function classifyFromCaption(caption, itemName) {
  if (!caption) return null;
  const text = caption.toLowerCase();
  console.log('Classifying caption:', text);

  const poorSignals = [
    'torn', 'damaged', 'broken', 'dirty', 'stained', 'ripped',
    'worn', 'old', 'tattered', 'ruined', 'hole', 'filthy', 'ragged'
  ];
  const goodSignals = [
    'clean', 'new', 'bright', 'colorful', 'neat', 'nice',
    'folded', 'fresh', 'good', 'white', 'blue', 'red', 'green'
  ];

  let poorScore = poorSignals.filter(kw => text.includes(kw)).length;
  let goodScore = goodSignals.filter(kw => text.includes(kw)).length;

  console.log(`Caption scores — poor: ${poorScore}, good: ${goodScore}`);

  if (poorScore >= 2) {
    return {
      label: 'poor',
      confidence: Math.min(0.92, 0.72 + poorScore * 0.05),
      summary: `The ${itemName} shows signs of damage or heavy wear based on visual analysis.`,
      reasons: ['Visual inspection detected damage or deterioration', 'Item may not meet donation standards']
    };
  } else if (poorScore === 1) {
    return {
      label: 'good',
      confidence: 0.72,
      summary: `The ${itemName} appears to be in fair condition with minor wear.`,
      reasons: ['Some wear detected but item appears usable', 'Passes basic donation criteria']
    };
  } else if (goodScore >= 2) {
    return {
      label: 'very_good',
      confidence: Math.min(0.92, 0.78 + goodScore * 0.03),
      summary: `The ${itemName} appears to be in great condition and suitable for donation.`,
      reasons: ['Item looks clean and well-maintained', 'No visible damage detected']
    };
  } else {
    return {
      label: 'good',
      confidence: 0.74,
      summary: `The ${itemName} appears to be in acceptable condition for donation.`,
      reasons: ['Item condition looks adequate for donation', 'Meets basic quality standards']
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
    if (!HF_TOKEN) throw new Error('HF_TOKEN not configured in environment');

    console.log(`\n=== Image verification for: "${itemName}" ===`);

    // Strategy: Use BLIP image captioning (simpler API — just send raw image bytes)
    // This is more reliable than VQA on HF free tier
    const caption = await askVQAv2(base64Data, mediaType, null, HF_TOKEN);

    if (caption) {
      const result = classifyFromCaption(caption, itemName);
      if (result) {
        console.log('Result from caption:', result.label, result.confidence);
        return res.json({ content: [{ text: JSON.stringify(result) }] });
      }
    }

    // Fallback: try VQA approach
    console.log('Captioning failed, trying VQA...');
    const vqaAnswers = await Promise.all([
      askVQA(base64Data, mediaType, `Is this ${itemName} torn or damaged?`, HF_TOKEN),
      askVQA(base64Data, mediaType, `Is this ${itemName} clean?`, HF_TOKEN),
      askVQA(base64Data, mediaType, `What is the condition of this ${itemName}?`, HF_TOKEN),
    ]);

    const validAnswers = vqaAnswers.filter(Boolean);
    console.log('VQA answers:', validAnswers);

    if (validAnswers.length > 0) {
      const result = classifyCondition(validAnswers, itemName);
      return res.json({ content: [{ text: JSON.stringify(result) }] });
    }

    throw new Error('All analysis methods failed');

  } catch (err) {
    console.error('Image verification error:', err.message);

    res.status(500).json({
      content: [{
        text: JSON.stringify({
          label: 'good',
          confidence: 0.5,
          summary: 'AI verification is warming up. Please click Retry in a few seconds.',
          reasons: ['Model may be loading — please retry']
        })
      }]
    });
  }
});

module.exports = router;