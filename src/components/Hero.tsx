
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const navigate = useNavigate();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const openVideo = () => {
    setIsVideoOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeVideo = () => {
    setIsVideoOpen(false);
    document.body.style.overflow = 'unset'; // Restore scrolling
  };

  const handleGetStarted = () => {
    navigate('/platform');
  };

  // Close video on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVideoOpen) {
        closeVideo();
      }
    };

    if (isVideoOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVideoOpen]);

  return (
    <section className="relative py-24 sm:py-40 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-950 dark:to-black transition-all duration-500">
      {/* Enhanced 3D Background Elements with improved positioning */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-[2.5rem] transform rotate-45 animate-float opacity-30 shadow-2xl blur-[1px]"></div>
        <div className="absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-3xl transform -rotate-12 animate-float-delayed opacity-40 shadow-xl blur-[0.5px]"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 dark:from-gray-500 dark:via-gray-600 dark:to-gray-700 rounded-2xl transform rotate-12 animate-float-slow opacity-35 shadow-lg"></div>
        <div className="absolute top-40 right-1/3 w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-500 rounded-xl transform rotate-45 animate-float opacity-25 shadow-md"></div>
        
        {/* Enhanced floating particles with staggered animations */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-black dark:bg-white rounded-full animate-bounce opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce-delayed opacity-40"></div>
        <div className="absolute top-1/2 left-1/5 w-4 h-4 bg-gray-500 dark:bg-gray-500 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-1/3 right-1/5 w-1 h-1 bg-gray-700 dark:bg-gray-300 rounded-full animate-ping opacity-50"></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce opacity-35" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Enhanced layered background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.04)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04)_0%,transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg,transparent,rgba(0,0,0,0.02),transparent)] dark:bg-[conic-gradient(from_45deg,transparent,rgba(255,255,255,0.02),transparent)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(0,0,0,0.01)_50%,transparent_51%)] dark:bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.01)_50%,transparent_51%)]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Badge with improved micro-interactions */}
          <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-gray-100 via-white to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-12 hover-scale transform hover:rotate-1 transition-all duration-500 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 mr-3 animate-pulse text-black dark:text-white" />
            <span className="bg-gradient-to-r from-black via-gray-600 to-black dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent tracking-wide">
              AI-Powered Website Generation
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full ml-3 animate-pulse shadow-lg"></div>
          </div>
          
          {/* Enhanced Main Headline with better typography */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight mb-12 transform-gpu perspective-1000 leading-[0.9]">
            <span className="block text-black dark:text-white animate-slide-up transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl font-extrabold">
              Build Websites
            </span>
            <span className="block animate-slide-up-delayed transform hover:scale-105 transition-all duration-500 ">
              with AI Magic
            </span>
          </h1>
          
          {/* Enhanced Subtitle with better spacing */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-400 mb-16 max-w-4xl mx-auto leading-relaxed animate-fade-in-up font-light tracking-wide">
            Transform your <span className="font-semibold bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">ideas</span> into stunning websites in seconds. 
            Just describe what you want, and watch our AI bring your <span className="font-semibold bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">vision</span> to life.
          </p>
          
          {/* Enhanced CTA Buttons with improved styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-32 animate-fade-in-up-delayed relative z-10">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-black/90 via-gray-800/90 to-black/90 dark:from-white/90 dark:via-gray-200/90 dark:to-white/90 hover:from-gray-800/95 hover:via-black/95 hover:to-gray-800/95 dark:hover:from-gray-200/95 dark:hover:via-white/95 dark:hover:to-gray-200/95 text-white dark:text-black px-12 py-6 text-xl font-bold rounded-2xl hover-scale group transform hover:-translate-y-2 shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700 backdrop-blur-sm"
            >
              Get Started
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="lg" 
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80 px-12 py-6 text-xl font-bold rounded-2xl hover-scale group transform hover:-translate-y-2 transition-all duration-500 border-2 border-gray-200/70 dark:border-gray-700/70 hover:border-gray-400/80 dark:hover:border-gray-500/80 shadow-lg hover:shadow-2xl backdrop-blur-sm bg-white/20 dark:bg-gray-900/20"
              onClick={openVideo}
            >
              <Play className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              Watch Demo
            </Button>
          </div>
        </div>
        
        {/* Enhanced 3D Grid Pattern with improved visual hierarchy - moved below buttons */}
        <div className="relative mt-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] border-2 border-gray-200 dark:border-gray-700 rounded-full opacity-20 animate-spin-slow shadow-inner"></div>
            <div className="absolute w-[480px] h-[480px] border-2 border-gray-300 dark:border-gray-600 rounded-full opacity-30 animate-spin-reverse shadow-lg"></div>
            <div className="absolute w-80 h-80 border-2 border-gray-400 dark:border-gray-500 rounded-full opacity-40 animate-spin-slow shadow-md"></div>
            <div className="absolute w-48 h-48 border-2 border-gray-500 dark:border-gray-400 rounded-full opacity-50 animate-spin-reverse"></div>
            <div className="absolute w-24 h-24 border-2 border-gray-600 dark:border-gray-300 rounded-full opacity-60 animate-spin-slow"></div>
          </div>
          
          {/* Enhanced central glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-black via-gray-600 to-black dark:from-white dark:via-gray-300 dark:to-white rounded-full animate-pulse shadow-2xl"></div>
            <div className="absolute w-6 h-6 bg-white dark:bg-black rounded-full animate-subtle-pulse"></div>
          </div>
          
          {/* Additional orbital elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-2 h-2 bg-black dark:bg-white rounded-full animate-spin-slow" style={{ transform: 'translateX(200px)', animationDuration: '20s' }}></div>
            <div className="absolute w-1 h-1 bg-gray-600 dark:bg-gray-400 rounded-full animate-spin-reverse" style={{ transform: 'translateX(-150px)', animationDuration: '15s' }}></div>
          </div>
        </div>
      </div>
      
      {/* Video Modal with smooth animations */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-6xl mx-4 animate-scale-up">
            {/* Close button */}
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 p-2 rounded-full hover:bg-white/10 group"
            >
              <X className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
            </button>
            
            {/* Video container with rounded corners and shadow */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
              <div className="relative aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/2I02SwXQGa8?autoplay=1&rel=0&modestbranding=1"
                  title="WebGenerator Demo"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            
            {/* Click outside to close */}
            <div 
              className="absolute inset-0 -z-10"
              onClick={closeVideo}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
