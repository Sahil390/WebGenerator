import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import AboutUs from "@/components/AboutUs";

const Index = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <Header />
      
      <main className="relative">
        <Hero />
        
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
