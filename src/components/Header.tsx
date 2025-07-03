
import { Button } from "@/components/ui/button";
import { Sparkles, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-all duration-300 shadow-lg dark:shadow-gray-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative w-10 h-10 bg-gradient-to-br from-black to-gray-700 dark:from-white dark:to-gray-300 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:shadow-2xl">
              <Sparkles className="w-6 h-6 text-white dark:text-black animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent rounded-2xl animate-subtle-pulse"></div>
            </div>
            <span className="text-2xl font-bold">
              WebGenerator
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-12">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-semibold relative group py-2"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-300 transition-all duration-300 group-hover:w-full shadow-sm"></span>
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 font-semibold relative group py-2"
            >
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-300 transition-all duration-300 group-hover:w-full shadow-sm"></span>
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 rounded-xl hover:rotate-180 transform"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={() => scrollToSection('generator')}
              className="bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-200 hover:from-gray-800 hover:to-black dark:hover:from-gray-200 dark:hover:to-white text-white dark:text-black px-8 py-3 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-xl font-semibold"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
