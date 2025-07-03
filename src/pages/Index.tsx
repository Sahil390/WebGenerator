import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GeneratorSection from "@/components/GeneratorSection";
import PreviewSection from "@/components/PreviewSection";
import FeatureGrid from "@/components/FeatureGrid";
import AboutUs from "@/components/AboutUs";
import apiService, { GenerateWebsiteResponse } from "@/lib/api";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<GenerateWebsiteResponse['data'] | null>(null);
  const { toast } = useToast();

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
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate website. Please try again.",
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
        <Hero />
        
        {/* Generator Section */}
        <section id="generator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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

        {/* Features Section */}
        <div id="features">
          <FeatureGrid />
        </div>

        {/* About Us Section */}
        <AboutUs />
      </main>
    </div>
  );
};

export default Index;
