
import { Card } from "@/components/ui/card";
import { Zap, Globe, Code, Palette, Smartphone, Shield, Rocket, Users } from "lucide-react";

const FeatureGrid = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate websites in seconds, not hours. Get instant results with our advanced AI."
    },
    {
      icon: Globe,
      title: "SEO Optimized",
      description: "Built-in SEO best practices ensure your site ranks well from day one."
    },
    {
      icon: Code,
      title: "Clean Code",
      description: "Export production-ready code that's maintainable and follows best practices."
    },
    {
      icon: Palette,
      title: "Customizable",
      description: "Fine-tune every aspect of your design with intuitive editing tools."
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "All generated websites are fully responsive and mobile-optimized."
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Enterprise-grade security with SSL certificates and regular updates."
    },
    {
      icon: Rocket,
      title: "Fast Hosting",
      description: "Deploy instantly to our global CDN for blazing-fast load times."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share and collaborate with your team in real-time on projects."
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">Everything You Need</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Powerful features that make website creation effortless and professional
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 group transform perspective-1000"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <feature.icon className="w-6 h-6 text-white dark:text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
