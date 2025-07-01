import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GeneratorSection from "@/components/GeneratorSection";
import PreviewSection from "@/components/PreviewSection";
import FeatureGrid from "@/components/FeatureGrid";
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

        {/* Examples Section */}
        <section id="examples" className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-black transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 text-black dark:text-white">Example Creations</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                See what's possible with AI-powered website generation
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Example cards with 3D effects */}
              {[
                { title: "E-commerce Store", desc: "Modern online shopping experience", color: "from-blue-500 to-purple-600" },
                { title: "Portfolio Site", desc: "Creative professional showcase", color: "from-green-500 to-teal-600" },
                { title: "SaaS Landing", desc: "Converting product pages", color: "from-orange-500 to-red-600" },
                { title: "Blog Platform", desc: "Content-focused design", color: "from-purple-500 to-pink-600" },
                { title: "Agency Website", desc: "Corporate and professional", color: "from-gray-600 to-gray-800" },
                { title: "Restaurant Site", desc: "Food and hospitality focused", color: "from-yellow-500 to-orange-600" }
              ].map((example, index) => (
                <div 
                  key={index}
                  className="group relative bg-white dark:bg-gray-900 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 transform perspective-1000 border border-gray-100 dark:border-gray-800"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-full h-48 bg-gradient-to-br ${example.color} rounded-2xl mb-6 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-lg group-hover:shadow-xl transform group-hover:scale-105`}></div>
                  <h3 className="text-xl font-bold mb-3 text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {example.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-500 transition-colors">
                    {example.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
