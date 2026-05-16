import React, { useState, useRef } from 'react';
import { Upload, X, Download, Loader } from 'lucide-react';

export default function StickerApp() {
  const [stage, setStage] = useState('upload'); // upload, preferences, processing, download
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preferences, setPreferences] = useState({
    textStyle: '',
    sentiment: '',
    location: '',
    uploadedTexts: null,
    useAI: true,
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState(null);
  const fileInputRef = useRef(null);
  const textFileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle text file upload
  const handleTextFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const texts = event.target.result.split('\n').filter(t => t.trim());
          setPreferences(p => ({ ...p, uploadedTexts: texts }));
        } catch {
          alert('Invalid text file format. Use one text per line.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Proceed to preferences after image upload
  const handleProceed = () => {
    if (!image) {
      alert('Please upload an image first');
      return;
    }
    setStage('preferences');
  };

  // Handle preference submission
  const handleSubmitPreferences = async () => {
    if (!preferences.textStyle || !preferences.sentiment) {
      alert('Please select all preferences');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStage('processing');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('preferences', JSON.stringify({
        textStyle: preferences.textStyle,
        sentiment: preferences.sentiment,
        location: preferences.location,
        useAI: preferences.useAI,
        uploadedTexts: preferences.uploadedTexts,
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 30, 90));
      }, 500);

      // Call backend
      const response = await fetch('/api/generate-stickers', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        setDownloadLink(data.downloadUrl);
        setStage('download');
      } else {
        alert('Error processing stickers. Make sure backend is running.');
        setStage('preferences');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: Make sure the backend server is running on port 5000');
      setStage('preferences');
    } finally {
      setLoading(false);
    }
  };

  // Reset app
  const handleReset = () => {
    setStage('upload');
    setImage(null);
    setImageFile(null);
    setPreferences({
      textStyle: '',
      sentiment: '',
      location: '',
      uploadedTexts: null,
      useAI: true,
    });
    setDownloadLink(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Minimal header */}
      <div className="border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 py-8">
          <h1 className="text-3xl font-light tracking-tight">sticker.</h1>
          <p className="text-sm text-gray-500 mt-1">generate custom stickers from your photos</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-md mx-auto px-6 py-12">
        {stage === 'upload' && (
          <div className="space-y-8">
            {/* Upload box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {image ? (
                <div className="space-y-4">
                  <img src={image} alt="Preview" className="w-full rounded-lg" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      setImageFile(null);
                    }}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    change image
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm">tap to upload image</p>
                  <p className="text-xs text-gray-500">jpg, png • max 5mb</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Action button */}
            <button
              onClick={handleProceed}
              disabled={!image}
              className="w-full bg-black text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              continue
            </button>
          </div>
        )}

        {stage === 'preferences' && (
          <div className="space-y-8">
            {/* Selected image mini preview */}
            <div className="flex gap-3 items-center">
              <img src={image} alt="Selected" className="w-12 h-12 rounded object-cover" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">image selected</p>
                <p className="text-sm font-medium">ready to customize</p>
              </div>
            </div>

            {/* Text style preference */}
            <div className="space-y-3">
              <label className="text-sm font-medium block">text style</label>
              <div className="space-y-2">
                {['motivational', 'casual', 'romantic', 'funny', 'inspirational'].map(style => (
                  <button
                    key={style}
                    onClick={() => setPreferences(p => ({ ...p, textStyle: style }))}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm capitalize ${
                      preferences.textStyle === style
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Sentiment preference */}
            <div className="space-y-3">
              <label className="text-sm font-medium block">sentiment</label>
              <div className="space-y-2">
                {['positive', 'neutral', 'humorous', 'thoughtful'].map(sentiment => (
                  <button
                    key={sentiment}
                    onClick={() => setPreferences(p => ({ ...p, sentiment }))}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm capitalize ${
                      preferences.sentiment === sentiment
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {sentiment}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-sm font-medium block">location (optional)</label>
              <input
                type="text"
                placeholder="e.g., New York, India, Dubai"
                value={preferences.location}
                onChange={(e) => setPreferences(p => ({ ...p, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
              />
              <p className="text-xs text-gray-500">used to customize text based on your region</p>
            </div>

            {/* Text source */}
            <div className="space-y-3">
              <label className="text-sm font-medium block">text source</label>
              <div className="space-y-2">
                <button
                  onClick={() => setPreferences(p => ({ ...p, useAI: true, uploadedTexts: null }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                    preferences.useAI
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ✨ generate with AI (100-200 texts)
                </button>
                <button
                  onClick={() => {
                    setPreferences(p => ({ ...p, useAI: false }));
                    textFileInputRef.current?.click();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                    !preferences.useAI && preferences.uploadedTexts
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  📄 upload text list ({preferences.uploadedTexts?.length || 0} texts)
                </button>
                <input
                  ref={textFileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleTextFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStage('upload')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                back
              </button>
              <button
                onClick={handleSubmitPreferences}
                className="flex-1 bg-black text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                generate stickers
              </button>
            </div>
          </div>
        )}

        {stage === 'processing' && (
          <div className="space-y-8 py-12">
            <div className="text-center space-y-4">
              <Loader className="w-8 h-8 mx-auto animate-spin" />
              <div>
                <p className="font-medium">creating your stickers</p>
                <p className="text-sm text-gray-500 mt-1">{Math.round(progress)}% complete</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>• analyzing image</p>
              <p>• generating text variations</p>
              <p>• processing sentiment</p>
              <p>• creating stickers</p>
              <p>• packaging as zip</p>
            </div>
          </div>
        )}

        {stage === 'download' && (
          <div className="space-y-8 py-8">
            <div className="text-center space-y-3">
              <div className="text-4xl">✨</div>
              <h2 className="text-xl font-medium">all done!</h2>
              <p className="text-sm text-gray-500">150 stickers ready to download</p>
            </div>

            {/* Download info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs text-gray-600 font-medium">what you get:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 150 unique stickers (512×512px)</li>
                <li>• sentiment-analyzed variations</li>
                <li>• location-personalized text</li>
                <li>• whatsapp-ready format</li>
              </ul>
            </div>

            {/* Download button */}
            <a
              href={downloadLink || '#'}
              download="stickers.zip"
              className="w-full bg-black text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              download zip
            </a>

            {/* WhatsApp export info */}
            <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-900 space-y-2">
              <p className="font-medium">to import to whatsapp:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>extract the zip file</li>
                <li>open whatsapp → stickers</li>
                <li>tap "add sticker pack"</li>
                <li>select the images</li>
              </ol>
            </div>

            {/* New sticker button */}
            <button
              onClick={handleReset}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              create another pack
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-12">
        <div className="max-w-md mx-auto px-6 py-6 text-xs text-gray-500 text-center">
          <p>sticker. • generate custom stickers in seconds</p>
        </div>
      </div>
    </div>
  );
}
