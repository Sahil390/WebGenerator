import { Card } from "@/components/ui/card";
import { Github, Linkedin, Mail, Heart, Code, Coffee } from "lucide-react";

const AboutUs = () => {
  const creators = [
    {
      name: "Sahil Narang",
      role: "Full-Stack Developer & AI Enthusiast",
      description: "Passionate about creating innovative web solutions and exploring the intersection of AI and modern web development. Specializes in React, Node.js, and AI integration.",
      image: "/api/placeholder/300/300", // You can replace this with actual image paths
      skills: ["React", "Node.js", "AI/ML", "TypeScript", "Python"],
      social: {
        github: "https://github.com/Sahil390", // Replace with actual links
        linkedin: "https://www.linkedin.com/in/sahil-narang-6600b11bb",
        email: "sahil.119480@stu.upes.ac.in"
      },
      gradient: "from-blue-500 to-purple-600"
    },
    {
      name: "Kushagra Agarwal",
      role: "Frontend Developer & UI/UX Designer",
      description: "Creative developer with a keen eye for design and user experience. Loves crafting beautiful, intuitive interfaces and bringing ideas to life through code.",
      image: "/api/placeholder/300/300", // You can replace this with actual image paths
      skills: ["React", "UI/UX", "Tailwind CSS", "JavaScript", "Design"],
      social: {
        github: "https://github.com/kushagraa263139", // Replace with actual links
        linkedin: "http://www.linkedin.com/in/kushagra-agrawal-b13a37362",
        email: "kushagraa685@gamil.com"
      },
      gradient: "from-green-500 to-teal-600"
    }
  ];

  return (
    <section id="about" className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-black dark:text-white">
            Meet the Creators
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Two passionate developers who brought this AI-powered website generator to life
          </p>
          <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
            <span>Built with</span>
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
            <span>and lots of</span>
            <Coffee className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        {/* Creator Cards */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {creators.map((creator, index) => (
            <Card 
              key={index}
              className="group relative bg-white dark:bg-gray-900 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 transform border border-gray-100 dark:border-gray-800 overflow-hidden"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${creator.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                {/* Profile Image */}
                <div className="text-center mb-6">
                  <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${creator.gradient} p-1 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {/* Placeholder avatar */}
                      <Code className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {creator.name}
                  </h3>
                  <p className={`text-sm font-semibold bg-gradient-to-r ${creator.gradient} bg-clip-text text-transparent`}>
                    {creator.role}
                  </p>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                  {creator.description}
                </p>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                    Skills & Technologies
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {creator.skills.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex justify-center space-x-4">
                  <a 
                    href={creator.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 group/social"
                  >
                    <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover/social:text-black dark:group-hover/social:text-white" />
                  </a>
                  <a 
                    href={creator.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all duration-300 hover:scale-110 group/social"
                  >
                    <Linkedin className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover/social:text-blue-600" />
                  </a>
                  <a 
                    href={`mailto:${creator.social.email}`}
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-110 group/social"
                  >
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover/social:text-red-500" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Project Story */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 p-8 text-center">
          <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">
            Our Story
          </h3>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We created this AI-powered website generator during a hackathon with the vision of democratizing web development. 
            Our goal was to make beautiful, functional websites accessible to everyone, regardless of their technical background. 
            By combining the power of AI with modern web technologies, we've built a tool that can transform ideas into reality with just a few words.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>React + TypeScript</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></span>
              <span>Gemini AI</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded"></span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AboutUs;
