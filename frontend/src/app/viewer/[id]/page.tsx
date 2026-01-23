'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Share2, 
  ArrowLeft,
  Loader2,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

// OpenSeadragon types
declare global {
  interface Window {
    OpenSeadragon: any;
  }
}

export default function ViewerPage() {
  const params = useParams();
  const threadId = params.id as string;
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<any>(null);

  // Load OpenSeadragon
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js';
    script.async = true;
    script.onload = initViewer;
    document.body.appendChild(script);

    return () => {
      if (osdRef.current) {
        osdRef.current.destroy();
      }
    };
  }, [threadId]);

  const initViewer = async () => {
    try {
      // Fetch manifest
      const response = await fetch(
        `http://localhost:8000/api/v1/screenshot/tiles/${threadId}/manifest.json`
      );
      
      if (!response.ok) {
        throw new Error('Thread not found');
      }
      
      const data = await response.json();
      setManifest(data);

      // Initialize OpenSeadragon
      if (viewerRef.current && window.OpenSeadragon) {
        osdRef.current = window.OpenSeadragon({
          element: viewerRef.current,
          tileSources: `http://localhost:8000/api/v1/screenshot/tiles/${threadId}/thread.dzi`,
          prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
          showNavigator: true,
          navigatorPosition: 'BOTTOM_RIGHT',
          navigatorSizeRatio: 0.15,
          animationTime: 0.3,
          blendTime: 0.1,
          constrainDuringPan: true,
          maxZoomPixelRatio: 2,
          minZoomLevel: 0.1,
          visibilityRatio: 0.5,
          zoomPerScroll: 1.2,
          gestureSettingsMouse: {
            scrollToZoom: true
          }
        });

        osdRef.current.addHandler('open', () => {
          setIsLoading(false);
        });

        osdRef.current.addHandler('open-failed', () => {
          setError('Failed to load thread image');
          setIsLoading(false);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => osdRef.current?.viewport.zoomBy(1.5);
  const handleZoomOut = () => osdRef.current?.viewport.zoomBy(0.67);
  const handleFitScreen = () => osdRef.current?.viewport.goHome();
  
  const handleDownload = () => {
    window.open(
      `http://localhost:8000/api/v1/screenshot/download/${threadId}`,
      '_blank'
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'Thread Capture', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleAnalyze = () => {
    window.location.href = `http://localhost:3000/?thread=${threadId}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-700" />
            
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm">Thread Viewer</h1>
                {manifest && (
                  <p className="text-gray-500 text-xs">
                    {manifest.width} × {manifest.height}px
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Analyze with AI</span>
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Viewer */}
      <div className="flex-1 relative">
        {/* OpenSeadragon container */}
        <div ref={viewerRef} className="absolute inset-0" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading thread...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </Link>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        {!isLoading && !error && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-800/90 backdrop-blur-sm rounded-xl p-1.5 shadow-lg z-20">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleFitScreen}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Instructions */}
        {!isLoading && !error && (
          <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-400 z-20">
            <p>🖱️ Scroll to zoom • Drag to pan</p>
          </div>
        )}
      </div>
    </div>
  );
}