import React from "react";
import { ArrowRight, Menu, X } from "lucide-react";

// Inline Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-white text-black hover:bg-gray-100",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "hover:bg-gray-800/50 text-white",
      gradient:
        "bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-10 px-5 text-sm",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// Navigation Component
interface NavigationProps {
  onGetStarted?: () => void;
}

const Navigation = React.memo(({ onGetStarted }: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">₹</span>
            </div>
            <span className="text-xl font-semibold text-white">FinGuru</span>
          </div>

          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#about" className="text-sm text-white/60 hover:text-white transition-colors">
              About
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button type="button" variant="gradient" size="sm" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
          <div className="px-6 py-4 flex flex-col gap-4">
            <a
              href="#features"
              className="text-sm text-white/60 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-white/60 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm text-white/60 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
              <Button type="button" variant="gradient" size="sm" onClick={onGetStarted}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
Navigation.displayName = "Navigation";

// Hero Component
interface HeroProps {
  onGetStarted?: () => void;
}

const Hero = React.memo(({ onGetStarted }: HeroProps) => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start px-6 py-20 md:py-24"
      style={{
        animation: "fadeIn 0.6s ease-out",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .hero-text {
          font-family: 'Poppins', sans-serif;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.5); }
        }
      `}</style>

      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-sm max-w-full">
        <span className="text-xs text-center whitespace-nowrap text-green-400">
          🚀 Powered by GPT-4.1 Reasoning Engine
        </span>
        <a
          href="#how-it-works"
          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-all active:scale-95 whitespace-nowrap"
          aria-label="Learn how it works"
        >
          Learn more
          <ArrowRight size={12} />
        </a>
      </aside>

      <h1
        className="hero-text text-4xl md:text-5xl lg:text-6xl font-semibold text-center max-w-4xl px-6 leading-tight mb-6"
        style={{
          background: "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255, 255, 255, 0.6))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.03em",
        }}
      >
        AI-Powered Finance
        <br />
        for Indian MSMEs
      </h1>

      <p className="text-sm md:text-base text-center max-w-2xl px-6 mb-10 text-gray-400">
        Scan receipts, speak expenses in Hinglish, get GST insights.
        <br />
        Every decision explained. You stay in control.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 mb-16">
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="rounded-xl flex items-center justify-center min-w-[180px]"
          aria-label="Get started with FinGuru"
          onClick={onGetStarted}
        >
          Get Started Free
          <ArrowRight size={18} />
        </Button>
        <a
          href="#how-it-works"
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          See how it works
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="w-full max-w-5xl relative pb-20">
        {/* Glow effect */}
        <div
          className="absolute left-1/2 w-[120%] pointer-events-none z-0"
          style={{
            top: "-30%",
            transform: "translateX(-50%)",
          }}
          aria-hidden="true"
        >
          <div
            className="w-full h-96 rounded-full blur-3xl opacity-30"
            style={{
              background: "radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Dashboard Preview */}
        <div 
          className="relative z-10"
          style={{ animation: "float 6s ease-in-out infinite" }}
        >
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
            {/* Browser bar */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                  finguru.app/dashboard
                </div>
              </div>
            </div>
            
            {/* Dashboard content */}
            <div className="p-6 bg-gradient-to-b from-gray-900 to-gray-950">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-white">₹24,580</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">GST Claimable</p>
                  <p className="text-2xl font-bold text-green-400">₹4,424</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Entries</p>
                  <p className="text-2xl font-bold text-white">47</p>
                </div>
              </div>
              
              {/* Chart placeholder */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 h-32 flex items-end justify-around gap-2">
                {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-green-600 to-green-400 rounded-t-md w-8"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
Hero.displayName = "Hero";

// Main Component
interface SaaSHeroProps {
  onGetStarted?: () => void;
}

export default function SaaSHero({ onGetStarted }: SaaSHeroProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navigation onGetStarted={onGetStarted} />
      <Hero onGetStarted={onGetStarted} />
    </main>
  );
}

export { SaaSHero, Navigation, Hero, Button };
