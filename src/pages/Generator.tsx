import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import GeneratorSection from "@/components/GeneratorSection";
import PreviewSection from "@/components/PreviewSection";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiService, { GenerateWebsiteResponse } from "@/lib/api";

const Generator = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<GenerateWebsiteResponse['data'] | null>(null);
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
    
    setIsGenerating(true);
    setGeneratedSite(null);
    
    try {
      const response = await apiService.generateWebsite({ prompt });
      
      if (response.success && response.data) {
        setGeneratedSite(response.data);
        toast({
          title: "Success!",
          description: "Your website has been generated successfully!",
        });
      } else {
        throw new Error(response.error || "Failed to generate website");
      }
    } catch (error) {
      console.error("Error generating website:", error);
      
      // Provide more specific error messages based on error type
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
          title = "Too Many Requests";
          description = "Please wait a moment before trying again.";
        } else if (errorStatus === 500) {
          title = "AI Service Overloaded";
          if (error.message.includes('overloaded')) {
            description = "The AI service is currently experiencing high demand. Please wait 1-2 minutes and try again with a shorter prompt.";
          } else {
            description = "Internal server error. Please try again later.";
          }
        } else {
          description = error.message;
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
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

  const handleShare = async () => {
    if (!generatedSite) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: generatedSite.title,
          text: generatedSite.description,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Website link has been copied to clipboard!",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to share website. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <Header />
      
      <main className="relative">
        {/* Hero Section for Generator Page */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-950 dark:to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
            
            {/* Page Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                <span className="block text-black dark:text-white">
                  Create Your Dream
                </span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Website
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Describe your vision and watch our AI bring it to life. From simple blogs to complex e-commerce stores, 
                we'll create exactly what you imagine.
              </p>
            </div>
          </div>
        </section>

        {/* Generator Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <GeneratorSection 
              prompt={prompt}
              setPrompt={setPrompt}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />
            
            <PreviewSection 
              generatedSite={generatedSite}
              isGenerating={isGenerating}
              onPreview={handlePreview}
              onExport={handleExport}
              onShare={handleShare}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Generator;
