import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wand2, Download, Eye, Loader2, Copy, Check, Monitor, Tablet, Smartphone, ExternalLink } from "lucide-react";
import apiService from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";

const Platform = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [generatedCss, setGeneratedCss] = useState("");
  const [generatedJs, setGeneratedJs] = useState("");
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for your website");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setLastError(null); // Clear any previous errors

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await apiService.generateWebsite({ prompt });
      if (response.success && response.data) {
        setGenerationProgress(100);
        setTimeout(() => {
          setGeneratedCode(response.data.html); // for preview iframe
          setGeneratedHtml(response.data.htmlOnly || "");
          setGeneratedCss(response.data.cssOnly || "");
          setGeneratedJs(response.data.jsOnly || "");
          setIsPreviewMode(true);
          setRetryCount(0); // Reset retry count on success
          toast.success("Website generated successfully!");
          clearInterval(progressInterval);
        }, 500);
      } else {
        throw new Error(response.error || "Failed to generate website");
      }
    } catch (error) {
      console.error("Generation error:", error);
      
      // Show specific error messages based on error type
      let errorMessage = "Failed to generate website. Please try again.";
      let isOverloadError = false;
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('overloaded') || errorMsg.includes('503')) {
          errorMessage = "🚫 AI service is currently overloaded. Please wait 30-60 seconds and try again.";
          isOverloadError = true;
        } else if (errorMsg.includes('timeout') || errorMsg.includes('504')) {
          errorMessage = "⏱️ Request timed out. Please try again with a shorter description.";
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          errorMessage = "🔄 Rate limit exceeded. Please wait a moment before trying again.";
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = "🌐 Network error. Please check your connection and try again.";
        } else if (errorMsg.includes('invalid') || errorMsg.includes('400')) {
          errorMessage = "❌ Invalid request. Please check your description and try again.";
        } else if (error.message && error.message.length > 10) {
          // Use the specific error message from API if it's meaningful
          errorMessage = error.message;
        }
      }
      
      setLastError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Show toast with retry guidance for overload errors
      if (isOverloadError) {
        toast.error(errorMessage, { 
          duration: 8000,
          action: {
            label: "Auto-retry in 30s",
            onClick: () => {}
          }
        });
        
        // Auto-retry after 30 seconds for overload errors (max 2 retries)
        if (retryCount < 2) {
          setTimeout(() => {
            toast.info("⏳ Retrying generation...");
            handleGenerate();
          }, 30000);
        }
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
      
      clearInterval(progressInterval);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);
    }
  };

  const handleCopyCode = async () => {
    let codeToCopy = "";
    if (activeTab === 'html') codeToCopy = generatedHtml;
    else if (activeTab === 'css') codeToCopy = generatedCss;
    else if (activeTab === 'js') codeToCopy = generatedJs;
    
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setIsCopied(true);
      toast.success(`${activeTab.toUpperCase()} code copied to clipboard!`);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = async () => {
    try {
      const zip = new JSZip();
      
      // Create a complete HTML file with proper structure
      const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Generated Website</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@100..900&family=Montserrat:wght@100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
${generatedHtml}
<script src="script.js"></script>
</body>
</html>`;
      
      zip.file("index.html", completeHtml);
      zip.file("styles.css", `/* Base styles for better compatibility */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* Generated styles */
${generatedCss}`);
      zip.file("script.js", generatedJs);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "website.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Website ZIP file downloaded!");
    } catch (error) {
      toast.error("Failed to create ZIP file");
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleNewGeneration = () => {
    setPrompt("");
    setGeneratedCode("");
    setGeneratedHtml("");
    setGeneratedCss("");
    setGeneratedJs("");
    setActiveTab('html');
    setIsPreviewMode(false);
    setIsCopied(false);
    setPreviewDevice('desktop');
    setGenerationProgress(0);
    setLastError(null);
    setRetryCount(0);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success("Website opened in new tab!");
  };

  const getPreviewDimensions = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px] h-[667px] max-h-[600px]';
      case 'tablet':
        return 'w-[768px] h-[1024px] max-h-[700px]';
      case 'desktop':
      default:
        return 'w-full h-full min-h-[600px]';
    }
  };

  const getPreviewScale = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'scale-[0.8]';
      case 'tablet':
        return 'scale-[0.65]';
      case 'desktop':
      default:
        return 'scale-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full animate-float opacity-60 blur-xl"></div>
        <div className="absolute top-60 right-20 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-orange-200/30 dark:from-pink-500/20 dark:to-orange-500/20 rounded-full animate-float-delayed opacity-50 blur-xl"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-br from-green-200/30 to-blue-200/30 dark:from-green-500/20 dark:to-blue-500/20 rounded-full animate-float-slow opacity-70 blur-lg"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-br from-yellow-200/30 to-red-200/30 dark:from-yellow-500/20 dark:to-red-500/20 rounded-full animate-bounce opacity-40 blur-md"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute top-1/2 left-1/5 w-1 h-1 bg-pink-500 dark:bg-pink-400 rounded-full animate-bounce opacity-70"></div>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg dark:shadow-gray-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Back to Home
              </Button>
              <div className="h-6 w-px bg-gray-300/50 dark:bg-gray-600/50" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                AI Website Generator
              </h1>
            </div>
            {generatedCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewGeneration}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-slide-in-right border-gray-200/50 dark:border-gray-700/50"
              >
                <Wand2 className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                New Generation
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isGenerating ? (
          // Loading State
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin"></div>
                <div className="relative w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-pulse">
                  Crafting Your Website...
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">
                Our AI is working its magic. This may take a moment.
              </p>
            </div>
            
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Generation Progress
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(generationProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${generationProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Steps */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 animate-pulse">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                      <span className="text-gray-700 dark:text-gray-300">Analyzing your requirements...</span>
                    </div>
                    <div className="flex items-center space-x-4 animate-pulse" style={{ animationDelay: '0.5s' }}>
                      <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce"></div>
                      <span className="text-gray-700 dark:text-gray-300">Generating HTML structure...</span>
                    </div>
                    <div className="flex items-center space-x-4 animate-pulse" style={{ animationDelay: '1s' }}>
                      <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce"></div>
                      <span className="text-gray-700 dark:text-gray-300">Applying styles and animations...</span>
                    </div>
                    <div className="flex items-center space-x-4 animate-pulse" style={{ animationDelay: '1.5s' }}>
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce"></div>
                      <span className="text-gray-700 dark:text-gray-300">Finalizing your website...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !isPreviewMode ? (
          // Prompt Interface
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 animate-slide-up">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Describe Your Dream Website
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slide-up-delayed">
                Tell our AI what kind of website you want to create. Be as detailed as possible for the best results.
              </p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] animate-scale-up border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center">
                  <Wand2 className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400 animate-pulse" />
                  Website Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Textarea
                    placeholder="e.g., Create a modern portfolio website for a graphic designer with a dark theme, hero section, portfolio gallery, about section, and contact form. Include smooth animations and a professional color scheme."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] resize-none border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400 dark:focus:border-blue-500 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 focus:scale-[1.02] backdrop-blur-sm"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="animate-pulse">Be specific about design, colors, sections, and functionality</span>
                    <span className={`transition-colors duration-300 ${prompt.length > 800 ? 'text-orange-500' : prompt.length > 500 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {prompt.length}/1000
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 dark:hover:from-blue-400 dark:hover:via-purple-400 dark:hover:to-pink-400 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      <span className="animate-pulse">Generating Your Website...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-300" />
                      Generate Website
                    </>
                  )}
                </Button>

                {/* Error Display and Retry Section */}
                {lastError && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-slide-down">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
                      <div className="flex-1">
                        <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                          {lastError}
                        </p>
                        {lastError.includes('overloaded') && (
                          <div className="mt-3 space-y-2">
                            <p className="text-red-600 dark:text-red-400 text-xs">
                              💡 <strong>Tips:</strong> The AI service experiences high demand. It usually resolves within 1-2 minutes.
                            </p>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => {
                                  setLastError(null);
                                  setRetryCount(0);
                                  handleGenerate();
                                }}
                                size="sm"
                                variant="outline"
                                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                🔄 Retry Now
                              </Button>
                              <span className="text-xs text-red-500 dark:text-red-400">
                                Retry #{retryCount}/3
                              </span>
                            </div>
                          </div>
                        )}
                        {(lastError.includes('timeout') || lastError.includes('504')) && (
                          <p className="text-red-600 dark:text-red-400 text-xs mt-2">
                            💡 <strong>Tip:</strong> Try a shorter, more concise description to reduce processing time.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setLastError(null)}
                        className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Preview Interface
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-200px)] animate-fade-in pb-4">
            {/* Code Panel */}
            <div className="space-y-4 animate-slide-in-left">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  Generated Code
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 border-gray-200/50 dark:border-gray-700/50"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Download ZIP
                  </Button>
                </div>
              </div>
              
              {/* Code Tabs */}
              <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('html')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'html'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  HTML
                </button>
                <button
                  onClick={() => setActiveTab('css')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'css'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  CSS
                </button>
                <button
                  onClick={() => setActiveTab('js')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'js'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  JavaScript
                </button>
              </div>
              
              <Card className="flex-1 h-[calc(100vh-320px)] shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mb-3">
                <CardContent className="p-0 h-full">
                  <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 rounded-lg relative">
                    <div className="absolute top-4 left-4 flex space-x-2 z-10">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <div className="h-full overflow-auto pt-12 px-4 pb-4">
                      <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap leading-relaxed">
                        {activeTab === 'html' && (generatedHtml || "No HTML code available")}
                        {activeTab === 'css' && (generatedCss || "No CSS code available")}
                        {activeTab === 'js' && (generatedJs || "No JavaScript code available")}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4 animate-slide-in-right">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  Live Preview
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Device Preview Buttons */}
                  <div className="flex items-center space-x-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1">
                    <Button
                      variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-2 transition-all duration-200 ${
                        previewDevice === 'desktop' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('tablet')}
                      className={`p-2 transition-all duration-200 ${
                        previewDevice === 'tablet' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-2 transition-all duration-200 ${
                        previewDevice === 'mobile' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:scale-105 border-gray-200/50 dark:border-gray-700/50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Open
                  </Button>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Eye className="w-4 h-4 animate-pulse" />
                    <span className="capitalize">{previewDevice} Preview</span>
                  </div>
                </div>
              </div>
              <Card className="flex-1 h-[calc(100vh-320px)] shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mb-3">
                <CardContent className="p-0 h-full">
                  <div className="h-full rounded-lg overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                    <div className="absolute top-4 left-4 flex space-x-2 z-10 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="h-full flex items-start justify-center p-4 pt-16 overflow-auto">
                      <div className={`${getPreviewDimensions()} ${getPreviewScale()} origin-top transition-all duration-500 shadow-2xl rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 my-auto`}>
                        <iframe
                          srcDoc={generatedCode}
                          className="w-full h-full border-0 rounded-lg"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          title="Website Preview"
                          style={{
                            minHeight: previewDevice === 'desktop' ? '600px' : 'auto',
                            maxHeight: previewDevice === 'mobile' ? '600px' : previewDevice === 'tablet' ? '700px' : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Platform;
