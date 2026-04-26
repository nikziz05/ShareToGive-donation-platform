import React, { useState } from 'react';

const DonationImageVerifier = () => {

  const [preview, setPreview] = useState(null);

  const handleImage = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setPreview(URL.createObjectURL(file));
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
        <img
          src={preview}
          alt="preview"
          className="mt-4 w-48 rounded-lg border"
        />
      )}

    </div>
  );
};

export default DonationImageVerifier;