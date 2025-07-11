import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, Loader2, Sparkles, Send, Eye, Download, Code, Monitor, Edit3, Smartphone, Tablet, Laptop, Key, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import apiService, { GenerateWebsiteResponse } from "@/lib/api";

const Generator = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<GenerateWebsiteResponse['data'] | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('split');
  const [aspectRatio, setAspectRatio] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Initializing...");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for your website",
        variant: "destructive",
      });
      return;
    }
    
    // Check if quota exceeded and no valid API key provided
    if (isQuotaExceeded && (!userApiKey || !userApiKey.startsWith('AIza'))) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Gemini API key to continue generating websites.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSite(null);
    setProgress(0);
    setProgressText("Initializing...");
    
    // Simulate progress updates
    const progressSteps = [
      { progress: 15, text: "Analyzing your requirements..." },
      { progress: 30, text: "Connecting to AI service..." },
      { progress: 45, text: "Generating design structure..." },
      { progress: 60, text: "Creating layouts and styling..." },
      { progress: 75, text: "Adding interactive elements..." },
      { progress: 90, text: "Finalizing your website..." },
      { progress: 100, text: "Complete!" }
    ];
    
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setProgress(progressSteps[stepIndex].progress);
        setProgressText(progressSteps[stepIndex].text);
        stepIndex++;
      }
    }, 800);
    
    try {
      const response = await apiService.generateWebsite({ 
        prompt,
        userApiKey: userApiKey || undefined 
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setProgressText("Complete!");
      
      if (response.success && response.data) {
        setIsQuotaExceeded(false); // Reset quota exceeded state on success
        setTimeout(() => {
          setGeneratedSite(response.data);
          toast({
            title: "Success!",
            description: "Your website has been generated successfully!",
          });
        }, 500);
      } else {
        throw new Error(response.error || "Failed to generate website");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating website:", error);
      
      let title = "Generation Failed";
      let description = "Failed to generate website. Please try again.";
      
      if (error instanceof Error) {
        const errorStatus = (error as any).status;
        const errorType = (error as any).errorType;
        
        if (errorStatus === 502) {
          title = "Request Timeout";
          if (errorType === 'TimeoutError') {
            description = "The request took too long. Try using a shorter, more specific prompt.";
          } else {
            description = "Server is temporarily unavailable. Please try again in a moment.";
          }
        } else if (errorStatus === 429) {
          title = "API Quota Exceeded";
          description = "The daily API limit has been reached. You can use your own API key to continue.";
          setIsQuotaExceeded(true);
        } else if (errorStatus === 500) {
          title = "AI Service Overloaded";
          if (error.message.includes('overloaded') || error.message.includes('quota')) {
            description = "The AI service quota has been exceeded. You can use your own API key to continue.";
            setIsQuotaExceeded(true);
          } else {
            description = "Internal server error. Please try again later.";
          }
        } else if (error.message.includes('quota') || error.message.includes('429')) {
          title = "Daily Limit Reached";
          description = "You've reached the daily generation limit. Use your own API key to continue generating.";
          setIsQuotaExceeded(true);
        } else {
          description = error.message;
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
        duration: 8000, // Show longer for quota errors
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!generatedSite) return;
    
    try {
      const blob = new Blob([generatedSite.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedSite.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exported!",
        description: "Your website has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export website. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (!generatedSite) return;
    
    try {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(generatedSite.html);
        newWindow.document.close();
      }
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to open preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetToInput = () => {
    setGeneratedSite(null);
    setPrompt("");
  };

  // Show main generator interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.05)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:30px_30px] animate-subtle-move"></div>
      
      {/* Floating elements for dynamics */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-4 h-4 bg-blue-400/20 rounded-full animate-float blur-sm"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-purple-400/15 rounded-full animate-float-delayed blur-sm"></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-green-400/20 rounded-full animate-bounce blur-sm"></div>
        <div className="absolute bottom-20 right-1/3 w-8 h-8 bg-pink-400/10 rounded-full animate-pulse blur-sm"></div>
      </div>

      <main className="relative z-10">
        {/* Header Section - Only for initial state */}
        {!isGenerating && !generatedSite && (
          <section className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Back Button */}
              <div className="mb-8 animate-slide-up">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl transform"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform duration-300" />
                  Back to Home
                </Button>
              </div>
              
              {/* Title Section */}
              <div className="text-center mb-16 animate-slide-up-delayed">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-gray-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight animate-gradient-shift">
                  AI Website Generator
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
                  Transform your ideas into stunning websites with the power of AI
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Compact header for result states */}
        {(isGenerating || generatedSite) && (
          <section className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl transform"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform duration-300" />
                  Back to Home
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Main Content Area */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-6xl mx-auto">
            
            {!isGenerating && !generatedSite ? (
              /* Input Section - Initial State */
              <div className="max-w-4xl mx-auto">
                
                {/* API Key Input - Show when quota exceeded */}
                {isQuotaExceeded && (
                  <div className="mb-6 animate-fade-in-up">
                    <div className="bg-orange-50/80 dark:bg-orange-950/50 backdrop-blur-xl rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50 shadow-xl">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
                            Daily Limit Reached
                          </h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                            The free daily quota has been exceeded. You can continue by using your own Gemini API key.
                          </p>
                          
                          {/* API Key Input */}
                          <div className="space-y-3">
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <input
                                type="password"
                                placeholder="Enter your Gemini API key (AIza...)"
                                value={userApiKey}
                                onChange={(e) => setUserApiKey(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 focus:border-orange-400/50 rounded-xl text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-300 focus:shadow-lg"
                                maxLength={100}
                              />
                              {userApiKey && !userApiKey.startsWith('AIza') && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                </div>
                              )}
                            </div>
                            
                            {userApiKey && !userApiKey.startsWith('AIza') && (
                              <p className="text-xs text-orange-600 dark:text-orange-400">
                                API key should start with "AIza"
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <a
                                href="https://aistudio.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline transition-colors"
                              >
                                Get your free API key →
                              </a>
                              
                              <Button
                                onClick={() => {
                                  setIsQuotaExceeded(false);
                                  setUserApiKey("");
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Section */}
                <div className="space-y-6 animate-fade-in-up">
                  <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/30 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 transform">
                    
                    {/* Header */}
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:rotate-6 transition-transform duration-300">
                        <Sparkles className="w-7 h-7 text-white animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          Describe Your Vision
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Be as detailed as you like
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Textarea */}
                    <div className="relative mb-6 group/textarea">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-400/10 rounded-xl opacity-0 group-focus-within/textarea:opacity-100 transition-all duration-500 scale-105 blur-sm"></div>
                      <Textarea
                        placeholder="Create a modern portfolio website for a photographer with dark aesthetic, smooth animations, and interactive galleries showcasing their best work..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="relative min-h-48 text-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 rounded-xl p-6 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none transition-all duration-300 focus:shadow-lg focus:scale-[1.01] text-gray-800 dark:text-gray-200 hover:border-gray-300/50 dark:hover:border-gray-500/50"
                        disabled={isGenerating}
                        maxLength={500}
                      />
                      <div className="absolute bottom-4 right-4 text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-600/50 transition-all duration-300 hover:scale-110">
                        <span className={`transition-colors duration-300 ${prompt.length > 400 ? 'text-orange-500' : prompt.length > 450 ? 'text-red-500' : ''}`}>
                          {prompt.length}/500
                        </span>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="mb-6 p-4 bg-blue-50/80 dark:bg-blue-950/50 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-xl hover:bg-blue-100/80 dark:hover:bg-blue-950/70 transition-all duration-300 group/tip">
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                        <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 group-hover/tip:rotate-12 transition-transform duration-300" />
                        Include style preferences, colors, layout ideas, and specific features for best results
                      </p>
                    </div>

                    {/* Generate Button */}
                    <Button 
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-xl font-semibold rounded-xl disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      <div className="relative flex items-center justify-center z-10">
                        <Wand2 className="mr-3 w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
                        Generate Website
                        <Send className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            ) : isGenerating ? (
              /* Loading Section - Glass Style with Real Progress */
              <div className="max-w-4xl mx-auto animate-fade-in-up">
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-12 border border-white/20 dark:border-gray-700/30 shadow-2xl text-center">
                  
                  {/* Loading Animation */}
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                    
                    {/* Progress indicator with percentage */}
                    <div className="mt-8 w-full max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {progressText}
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-sm transition-all duration-500 ease-out relative overflow-hidden"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Creating Your Website</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Our AI is crafting your perfect website. This may take a few moments...
                    </p>
                    
                    {/* Dynamic loading steps */}
                    <div className="mt-8 space-y-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className={`flex items-center justify-center space-x-2 transition-opacity duration-300 ${progress >= 15 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${progress >= 15 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                        <span>Analyzing your requirements</span>
                        {progress >= 30 && <span className="text-green-500">✓</span>}
                      </div>
                      <div className={`flex items-center justify-center space-x-2 transition-opacity duration-300 ${progress >= 30 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${progress >= 30 ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                        <span>Generating design structure</span>
                        {progress >= 60 && <span className="text-green-500">✓</span>}
                      </div>
                      <div className={`flex items-center justify-center space-x-2 transition-opacity duration-300 ${progress >= 60 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${progress >= 60 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>Creating beautiful layouts</span>
                        {progress >= 90 && <span className="text-green-500">✓</span>}
                      </div>
                      <div className={`flex items-center justify-center space-x-2 transition-opacity duration-300 ${progress >= 90 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${progress >= 90 ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                        <span>Finalizing your website</span>
                        {progress >= 100 && <span className="text-green-500">✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : generatedSite ? (
              /* Result Section - Two Tile Layout */
              <div className="space-y-6 animate-fade-in-up">
                
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{generatedSite.title}</h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Aspect Ratio Controls */}
                    <div className="flex bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-600/50">
                      <Button
                        variant={aspectRatio === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setAspectRatio('desktop')}
                        className="h-8 px-3"
                      >
                        <Laptop className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={aspectRatio === 'tablet' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setAspectRatio('tablet')}
                        className="h-8 px-3"
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={aspectRatio === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setAspectRatio('mobile')}
                        className="h-8 px-3"
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <Button
                      onClick={handlePreview}
                      variant="outline"
                      size="sm"
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/50 dark:border-gray-600/50 hover:scale-105 transition-transform duration-200"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      size="sm"
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/50 dark:border-gray-600/50 hover:scale-105 transition-transform duration-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      onClick={() => { setGeneratedSite(null); setPrompt(""); }}
                      variant="outline"
                      size="sm"
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/50 dark:border-gray-600/50 hover:scale-105 transition-transform duration-200"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      New
                    </Button>
                  </div>
                </div>

                {/* Two-Tile Layout - Larger Height */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Code Tile */}
                  <div className="bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="bg-gray-800/90 dark:bg-gray-900/90 backdrop-blur-sm px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-400 font-mono">index.html</span>
                      </div>
                      <Code className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="h-[600px] overflow-auto">
                      <pre className="text-sm text-gray-300 p-6 font-mono leading-relaxed hover:text-gray-100 transition-colors duration-300">
                        <code>{generatedSite.html}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Preview Tile */}
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm px-6 py-4 border-b border-gray-200/50 dark:border-gray-600/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Live Preview</span>
                      </div>
                      <Monitor className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="h-[600px] overflow-hidden relative">
                      <div className={`transition-all duration-500 ${
                        aspectRatio === 'mobile' ? 'w-80 mx-auto scale-75' :
                        aspectRatio === 'tablet' ? 'w-full scale-90' :
                        'w-full'
                      }`}>
                        <iframe
                          srcDoc={generatedSite.html}
                          className="w-full h-[600px] border-0 rounded-lg shadow-inner"
                          title="Website Preview"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Input for Modifications */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
                  <div className="flex items-end space-x-4">
                    <div className="flex-1 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-400/5 to-blue-400/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500 scale-105 blur-sm"></div>
                      
                      <Textarea
                        placeholder="Want to modify something? Describe the changes..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-16 max-h-32 text-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-400/50 rounded-xl p-4 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none transition-all duration-300 text-gray-800 dark:text-gray-200"
                        disabled={isGenerating}
                        maxLength={500}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-full">
                        {prompt.length}/500
                      </div>
                    </div>
                    <Button 
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl group/btn relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2 group-hover/btn:rotate-12 transition-transform duration-300 relative z-10" />
                          <span className="relative z-10">Generate</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Generator;
