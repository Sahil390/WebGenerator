import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Loader2, Monitor, Smartphone, Tablet, Sparkles, CheckCircle, Code } from "lucide-react";
import { useState, useEffect } from "react";
import { GenerateWebsiteResponse } from "@/lib/api";

interface PreviewSectionProps {
  generatedSite: GenerateWebsiteResponse['data'] | null;
  isGenerating: boolean;
  onPreview?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

const PreviewSection = ({ generatedSite, isGenerating, onPreview, onExport, onShare }: PreviewSectionProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const loadingSteps = [
    "Analyzing your requirements...",
    "Designing the layout...",
    "Generating HTML & CSS...",
    "Adding animations...",
    "Optimizing for performance...",
    "Finalizing your website..."
  ];

  // Simulate loading progress
  useEffect(() => {
    if (isGenerating) {
      setLoadingProgress(0);
      setLoadingStep(0);
      setIframeLoaded(false);
      
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const stepInterval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= loadingSteps.length - 1) {
            clearInterval(stepInterval);
            return loadingSteps.length - 1;
          }
          return prev + 1;
        });
      }, 1500);

      return () => {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      };
    }
  }, [isGenerating]);

  // Update iframe when generatedSite changes
  useEffect(() => {
    if (generatedSite) {
      setIframeKey(prev => prev + 1);
      setIframeLoaded(false);
    }
  }, [generatedSite]);

  // Process the HTML to make it safer for iframe preview
  const getSafeHtml = (html: string) => {
    if (!html) return '';
    
    // Remove or modify potentially problematic elements
    let safeHtml = html
      // Remove any existing base tags that might affect navigation
      .replace(/<base[^>]*>/gi, '')
      // Remove or neutralize form submissions
      .replace(/<form[^>]*>/gi, '<form onsubmit="event.preventDefault(); return false;">')
      // Modify all links to prevent navigation
      .replace(/<a\s+([^>]*href\s*=\s*["'][^"']*["'][^>]*)>/gi, '<a $1 onclick="event.preventDefault(); return false;" target="_self">')
      // Remove any window.location or document.location changes
      .replace(/window\.location\s*[=\.]/gi, '// window.location')
      .replace(/document\.location\s*[=\.]/gi, '// document.location')
      // Remove any window.open calls
      .replace(/window\.open\s*\(/gi, '// window.open(')
      // Add prevention script at the beginning of body
      .replace(/<body([^>]*)>/i, `<body$1>
        <script>
          // Prevent all navigation attempts
          if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', function(e) {
              e.preventDefault();
              e.returnValue = '';
            });
            
            // Override navigation methods
            const originalOpen = window.open;
            window.open = function() { return null; };
            
            // Prevent form submissions from navigating
            document.addEventListener('submit', function(e) {
              e.preventDefault();
              return false;
            });
            
            // Prevent link clicks from navigating
            document.addEventListener('click', function(e) {
              if (e.target.tagName === 'A' || e.target.closest('a')) {
                e.preventDefault();
                return false;
              }
            });
          }
        </script>`)
      // Add a base tag to prevent relative URL navigation
      .replace(/<head>/i, '<head><base href="javascript:void(0);">');
    
    return safeHtml;
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    
    // Additional security: Try to prevent navigation in the iframe
    try {
      const iframe = document.querySelector(`iframe[title="Preview of ${generatedSite?.title}"]`) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        // Override window.open and location changes in the iframe
        iframe.contentWindow.addEventListener('beforeunload', (e) => {
          e.preventDefault();
          e.returnValue = '';
          return '';
        });
      }
    } catch (error) {
      // Silently fail - cross-origin restrictions expected
      console.log('Cross-origin iframe access restricted (expected)');
    }
  };

  if (isGenerating) {
    return (
      <div className="sticky top-24">
        <Card className="p-8 border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
          <div className="text-center space-y-8">
            {/* Enhanced Loading Animation */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse-scale shadow-2xl">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
              <div className="absolute inset-2 w-20 h-20 mx-auto border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            </div>

            <div>
              <h3 className="text-3xl font-bold mb-4 text-black dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Creating Your Website
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                Our AI is crafting something amazing for you...
              </p>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="space-y-4">
              <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white drop-shadow-lg">
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
              </div>
              
              {/* Current Step */}
              <div className="flex items-center justify-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 animate-pulse">
                  {loadingSteps[loadingStep]}
                </span>
              </div>
            </div>

            {/* Loading Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                💡 Tip: The more detailed your description, the better the result!
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Include colors, layout preferences, sections, and any specific features you want.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!generatedSite) {
    return (
      <div className="sticky top-24">
        <Card className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 backdrop-blur-sm">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center transform hover:rotate-12 transition-all duration-300 shadow-lg">
              <Code className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-black dark:text-white">Preview Area</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Your generated website will appear here once you create one
              </p>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ✨ Describe your website idea and watch the magic happen!
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="sticky top-24 space-y-6">
      {/* Device Preview Toggle */}
      <div className="flex items-center justify-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setViewMode('desktop')}
          className={`p-3 rounded-lg transition-all duration-300 ${
            viewMode === 'desktop' 
              ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-md' 
              : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Monitor className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('tablet')}
          className={`p-3 rounded-lg transition-all duration-300 ${
            viewMode === 'tablet' 
              ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-md' 
              : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Tablet className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('mobile')}
          className={`p-3 rounded-lg transition-all duration-300 ${
            viewMode === 'mobile' 
              ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-md' 
              : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-5 h-5" />
        </button>
      </div>

      <Card className="border-2 border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
        {/* Enhanced Preview Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="flex-1 mx-4 px-3 py-1 bg-white dark:bg-gray-800 rounded-md text-sm text-gray-500 dark:text-gray-400 border">
                {generatedSite.title}
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 capitalize font-medium">
              {viewMode} • Generated
            </div>
          </div>
        </div>

        {/* Actual Website Preview in iframe */}
        <div className={`bg-white dark:bg-gray-900 relative overflow-hidden transition-all duration-500 ${
          viewMode === 'desktop' ? 'aspect-[4/3]' :
          viewMode === 'tablet' ? 'aspect-[3/4] max-w-md mx-auto' :
          'aspect-[9/16] max-w-xs mx-auto'
        }`}>
          {/* Loading overlay for iframe */}
          {!iframeLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading preview...</p>
              </div>
            </div>
          )}
          
          <iframe
            key={iframeKey}
            srcDoc={getSafeHtml(generatedSite.html)}
            className="w-full h-full border-0"
            title={`Preview of ${generatedSite.title}`}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            onLoad={handleIframeLoad}
            style={{ 
              opacity: iframeLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
        </div>
      </Card>

      {/* Enhanced Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={onPreview}
          className="hover-scale transform hover:-translate-y-1 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 backdrop-blur-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button 
          variant="outline" 
          onClick={onExport}
          className="hover-scale transform hover:-translate-y-1 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 backdrop-blur-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Website Info */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-green-800 dark:text-green-300">Website Generated Successfully!</h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              {generatedSite.description}
            </p>
          </div>
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
      </Card>
    </div>
  );
};

export default PreviewSection;
