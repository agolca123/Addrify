import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PixelCodeGeneratorProps {
  userId: string;
}

export const PixelCodeGenerator: React.FC<PixelCodeGeneratorProps> = ({ userId }) => {
  const [copied, setCopied] = useState(false);
  
  const pixelCode = `
<script>
  var script = document.createElement('script');
  script.src = "/tracker.js";
  script.async = true;
  script.setAttribute('data-user-id', '${userId}');
  document.head.appendChild(script);
</script>
`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pixelCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Takip Kodunuz</h3>
        <button
          onClick={copyToClipboard}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
            copied
              ? 'bg-green-700 hover:bg-green-600'
              : 'bg-green-700 hover:bg-green-600'
          } text-white`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Kopyala
            </>
          )}
        </button>
      </div>
      <div className="bg-gray-50 p-4 rounded-md">
        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{pixelCode}</pre>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Kurulum Talimatları:</p>
        <ol className="list-decimal ml-4 space-y-2">
          <li>Yukarıdaki kodu kopyalayın</li>
          <li>Web sitenizin <code>&lt;/body&gt;</code> etiketinden hemen önce yapıştırın</li>
          <li>Ziyaretçiler sitenize eriştiğinde konum izni isteyecektir</li>
          <li>İzin verildikten sonra konum verileri panelinizde görünecektir</li>
        </ol>
      </div>
    </div>
  );
};