import React, { useState } from 'react';

const DonationImageVerifier = ({ onVerified }) => {

  const [preview, setPreview] = useState(null);

  const handleImage = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setPreview(URL.createObjectURL(file));

    // Temporary fake AI result
    onVerified({
      canDonate: true,
      prediction: "Good Condition"
    });
  };

  return (
    <div className="mt-4 border border-gray-300 rounded-lg p-4 bg-gray-50">

      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Item Image
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={handleImage}
        className="w-full border border-gray-300 rounded-lg p-2 bg-white"
      />

      {preview && (
        <div className="mt-4">

          <img
            src={preview}
            alt="preview"
            className="w-48 rounded-lg border"
          />

          <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg">
            AI Result: Good Condition ✅
          </div>

        </div>
      )}

    </div>
  );
};

export default DonationImageVerifier;