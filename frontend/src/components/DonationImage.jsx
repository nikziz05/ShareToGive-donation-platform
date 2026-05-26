import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle, RefreshCw, Image } from 'lucide-react';

/**
 * DonationImageVerifier
 * 
 * Drop-in component for ShareToGive's physical donation flow.
 * Uses Claude Vision API to analyze uploaded item photos and
 * returns a condition label: "Very Good", "Good", or "Poor".
 * 
 * Props:
 *   onVerified(result) — called when verification completes
 *     result: { label: 'very_good'|'good'|'poor', confidence: 0-1, summary: string, canDonate: boolean }
 *   onReset()          — called when user clears the image
 *   itemName           — optional string like "Clothes" to give context to the AI
 */

const CONDITION_CONFIG = {
  very_good: {
    label: 'Very Good',
    color: '#059669',
    bg: '#d1fae5',
    border: '#6ee7b7',
    textColor: '#065f46',
    icon: CheckCircle,
    message: 'Great condition! This item is ready to be donated.',
  },
  good: {
    label: 'Good',
    color: '#2563eb',
    bg: '#dbeafe',
    border: '#93c5fd',
    textColor: '#1e40af',
    icon: CheckCircle,
    message: 'Acceptable condition. This item can be donated.',
  },
  poor: {
    label: 'Poor Condition',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    textColor: '#991b1b',
    icon: XCircle,
    message: 'This item may not meet donation standards. Please review.',
  },
};

const DonationImageVerifier = ({ onVerified, onReset, itemName = 'item' }) => {
  const [image, setImage] = useState(null);         // base64
  const [imageFile, setImageFile] = useState(null); // File object
  const [status, setStatus] = useState('idle');     // idle | uploading | verifying | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const analyzeImage = useCallback(async (file) => {
    setStatus('verifying');
    setErrorMsg('');

    try {
      const base64Data = await toBase64(file);
      const mediaType = file.type || 'image/jpeg';


const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://kindnest1-backend.onrender.com'}/api/verify-image`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': localStorage.getItem('token')
  },
  body: JSON.stringify({ base64Data, mediaType, itemName }),
});

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.content.map((c) => c.text || '').join('');
      const clean = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      const finalResult = {
        label: parsed.label || 'good',
        confidence: Math.round((parsed.confidence || 0.8) * 100),
        summary: parsed.summary || '',
        reasons: parsed.reasons || [],
        canDonate: parsed.label !== 'poor',
      };

      setResult(finalResult);
      setStatus('done');
      onVerified?.(finalResult);
    } catch (err) {
      console.error('Image verification error:', err);
      setErrorMsg('Could not analyze image. Please try again or skip to proceed manually.');
      setStatus('error');
    }
  }, [itemName, onVerified]);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    setStatus('uploading');
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      analyzeImage(file);
    };
    reader.readAsDataURL(file);
  }, [analyzeImage]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleReset = () => {
    setImage(null);
    setImageFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    onReset?.();
  };

  const config = result ? CONDITION_CONFIG[result.label] : null;

  // ── Idle / upload zone ──────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Camera className="w-4 h-4 text-blue-500" />
          Upload Item Photo <span className="text-blue-600 font-semibold">(AI Verification)</span>
          
        </label>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Drop a photo here or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP · max 5 MB</p>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {errorMsg}
          </p>
        )}
      </div>
    );
  }

  // ── Verifying spinner ────────────────────────────────────────────────────────
  if (status === 'uploading' || status === 'verifying') {
    return (
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-4">
        {image && (
          <img src={image} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-blue-200" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-700">
              {status === 'uploading' ? 'Loading image...' : 'AI is analyzing your item...'}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full animate-pulse"
              style={{ width: status === 'uploading' ? '30%' : '75%', transition: 'width 0.5s ease' }}
            />
          </div>
          <p className="text-xs text-blue-500 mt-1">Checking condition, cleanliness, and usability…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          {image && (
            <img src={image} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-yellow-200 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-800">Verification unavailable</span>
            </div>
            <p className="text-xs text-yellow-700">{errorMsg}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => imageFile && analyzeImage(imageFile)}
                className="text-xs px-3 py-1.5 rounded-lg bg-yellow-200 text-yellow-800 hover:bg-yellow-300 transition-colors font-medium"
              >
                Retry
              </button>
              <button
                onClick={handleReset}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                Try different photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────────
  if (status === 'done' && result && config) {
    const Icon = config.icon;
    return (
      <div className="mb-4 rounded-xl border-2 overflow-hidden" style={{ borderColor: config.border }}>
        <div className="flex items-stretch">
          {/* Image thumbnail */}
          {image && (
            <div className="w-24 flex-shrink-0">
              <img src={image} alt="donated item" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Result body */}
          <div className="flex-1 p-4" style={{ background: config.bg }}>
            {/* Condition badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" style={{ color: config.color }} />
                <span className="font-bold text-sm" style={{ color: config.textColor }}>
                  Condition: {config.label}
                </span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: config.color + '22', color: config.textColor }}
              >
                {result.confidence}% confidence
              </span>
            </div>

            {/* Summary */}
            <p className="text-xs mb-2" style={{ color: config.textColor }}>
              {result.summary}
            </p>

            {/* Reasons */}
            {result.reasons?.length > 0 && (
              <ul className="text-xs space-y-0.5 mb-3" style={{ color: config.textColor + 'cc' }}>
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span style={{ color: config.color }}>›</span> {r}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA message */}
            <p className="text-xs font-medium" style={{ color: config.textColor }}>
              {config.message}
            </p>

            {/* Retake button */}
            <button
              onClick={handleReset}
              className="mt-3 text-xs flex items-center gap-1 underline opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: config.textColor }}
            >
              <Image className="w-3 h-3" /> Use different photo
            </button>
          </div>
        </div>

        {/* Poor condition warning bar */}
        {!result.canDonate && (
          <div className="bg-red-100 border-t border-red-200 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">
              This item may not be accepted. Please review or replace it before donating.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default DonationImageVerifier;