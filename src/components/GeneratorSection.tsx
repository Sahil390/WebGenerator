import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Wand2, Loader2, Sparkles, Lightbulb, Zap, Palette, Globe, Code } from "lucide-react";

interface GeneratorSectionProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const GeneratorSection = ({ prompt, setPrompt, isGenerating, onGenerate }: GeneratorSectionProps) => {
  const examplePrompts = [
    {
      title: "Portfolio Website",
      prompt: "A modern portfolio website for a photographer with dark aesthetic, smooth animations, and interactive galleries showcasing their best work",
      icon: Palette,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "E-commerce Store",
      prompt: "An e-commerce store for handmade jewelry with minimalist design, shopping cart functionality, and beautiful product showcases",
      icon: Globe,
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "SaaS Landing",
      prompt: "A landing page for a SaaS startup with clean animations, call-to-action buttons, and modern design that converts visitors",
      icon: Zap,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Blog Platform",
      prompt: "A blog about sustainable living with nature-inspired layout, reading features, and beautiful typography",
      icon: Code,
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Restaurant Site",
      prompt: "A restaurant website with elegant food showcase, online ordering system, and beautiful imagery",
      icon: Palette,
      color: "from-yellow-500 to-orange-600"
    },
    {
      title: "Agency Website",
      prompt: "A corporate agency website with professional design, case studies, and contact forms",
      icon: Globe,
      color: "from-gray-600 to-gray-800"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-black dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Describe Your Vision
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Tell our AI what kind of website you want to create
            </p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
          Be as detailed or simple as you like. The more specific you are, the better results you'll get. 
          Include details about style, functionality, and purpose.
        </p>
      </div>

      <Card className="p-8 border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-500 bg-white dark:bg-gray-900 transform hover:-translate-y-2 hover:shadow-2xl backdrop-blur-sm">
        <div className="space-y-6">
          <div className="relative group">
            <Textarea
              placeholder="Describe your website briefly for faster generation... (e.g., 'Modern restaurant website with menu and contact page')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-40 text-lg border-0 focus:ring-0 resize-none bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 leading-relaxed p-4 group-hover:placeholder-gray-400 dark:group-hover:placeholder-gray-300 transition-colors duration-300"
              disabled={isGenerating}
            />
            <div className="absolute bottom-4 right-4 text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 px-2 py-1 rounded">
              {prompt.length}/500
            </div>
          </div>
          
          {/* Tip for better generation */}
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              <strong>Pro tip:</strong> Keep descriptions concise (1-2 sentences) for faster generation and better results!
            </p>
          </div>
          
          <Button 
            onClick={onGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white py-6 text-xl font-semibold rounded-xl disabled:opacity-50 hover-scale group transform hover:-translate-y-1 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                <span className="animate-pulse">Generating Your Website...</span>
              </>
            ) : (
              <>
                <Wand2 className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                Generate Website
                <Sparkles className="ml-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="space-y-6 animate-fade-in-delayed">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Try these examples:
          </h3>
        </div>
        <div className="grid gap-4">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example.prompt)}
              disabled={isGenerating}
              className="text-left p-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-500 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${example.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <example.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {example.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-500 transition-colors leading-relaxed text-sm">
                    "{example.prompt}"
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Pro Tips for Better Results</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Include specific colors, fonts, or design styles</li>
              <li>• Mention functionality like contact forms, galleries, or e-commerce</li>
              <li>• Specify the target audience or purpose</li>
              <li>• Add details about animations or interactions</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GeneratorSection;
