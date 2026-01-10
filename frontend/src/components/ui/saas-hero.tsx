import React from "react";
import { ArrowRight, Menu, X } from "lucide-react";

// Animated Interactive Chart Component
const AnimatedChart = React.memo(() => {
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Data points
  const incomeData = [
    { x: 0, y: 80, value: "₹12.4K", month: "Jan" },
    { x: 57, y: 55, value: "₹24.8K", month: "Feb" },
    { x: 114, y: 35, value: "₹38.2K", month: "Mar" },
    { x: 171, y: 45, value: "₹32.1K", month: "Apr" },
    { x: 228, y: 25, value: "₹45.6K", month: "May" },
    { x: 285, y: 15, value: "₹52.3K", month: "Jun" },
    { x: 342, y: 20, value: "₹48.9K", month: "Jul" },
    { x: 400, y: 10, value: "₹58.2K", month: "Aug" },
  ];

  const expenseData = [
    { x: 0, y: 95, value: "₹8.2K" },
    { x: 57, y: 85, value: "₹12.4K" },
    { x: 114, y: 75, value: "₹18.6K" },
    { x: 171, y: 80, value: "₹15.2K" },
    { x: 228, y: 60, value: "₹28.4K" },
    { x: 285, y: 50, value: "₹32.1K" },
    { x: 342, y: 55, value: "₹29.8K" },
    { x: 400, y: 40, value: "₹38.5K" },
  ];

  // Generate smooth curve path
  const generatePath = (data: typeof incomeData) => {
    if (data.length < 2) return "";
    let path = `M${data[0].x},${data[0].y}`;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
      path += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
    }
    return path;
  };

  const generateAreaPath = (data: typeof incomeData) => {
    const linePath = generatePath(data);
    return `${linePath} L400,120 L0,120 Z`;
  };

  const incomePath = generatePath(incomeData);
  const incomeAreaPath = generateAreaPath(incomeData);
  const expensePath = generatePath(expenseData);
  const expenseAreaPath = generateAreaPath(expenseData);

  // Intersection observer for animation trigger
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={chartRef} className="relative">
      <style>{`
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInArea {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .chart-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
        }
        .chart-line.animate {
          animation: drawLine 2s ease-out forwards;
        }
        .chart-area {
          opacity: 0;
        }
        .chart-area.animate {
          animation: fadeInArea 1s ease-out 0.5s forwards;
        }
      `}</style>
      
      <div className="h-44 relative">
        <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="incomeGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="expenseGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
            <line x1="0" y1="30" x2="400" y2="30" />
            <line x1="0" y1="60" x2="400" y2="60" />
            <line x1="0" y1="90" x2="400" y2="90" />
            {incomeData.map((d, i) => (
              <line key={i} x1={d.x} y1="0" x2={d.x} y2="120" strokeOpacity="0.03" />
            ))}
          </g>
          
          {/* Income area */}
          <path
            d={incomeAreaPath}
            fill="url(#incomeGradient2)"
            className={`chart-area ${isVisible ? 'animate' : ''}`}
          />
          
          {/* Expense area */}
          <path
            d={expenseAreaPath}
            fill="url(#expenseGradient2)"
            className={`chart-area ${isVisible ? 'animate' : ''}`}
          />
          
          {/* Expense line */}
          <path
            d={expensePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            className={`chart-line ${isVisible ? 'animate' : ''}`}
            style={{ animationDelay: '0.3s' }}
          />
          
          {/* Income line with glow */}
          <path
            d={incomePath}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow2)"
            className={`chart-line ${isVisible ? 'animate' : ''}`}
          />
          
          {/* Interactive hover areas */}
          {incomeData.map((point, i) => (
            <g key={i}>
              {/* Invisible hover area */}
              <rect
                x={point.x - 20}
                y={0}
                width={40}
                height={120}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              
              {/* Data point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? 6 : 4}
                fill="#22c55e"
                stroke="#000"
                strokeWidth="2"
                style={{
                  transition: 'all 0.2s ease',
                  opacity: isVisible ? 1 : 0,
                  transitionDelay: `${0.8 + i * 0.1}s`,
                }}
              />
              
              {/* Expense point */}
              <circle
                cx={expenseData[i].x}
                cy={expenseData[i].y}
                r={hoveredPoint === i ? 5 : 3}
                fill="#3b82f6"
                stroke="#000"
                strokeWidth="1.5"
                style={{
                  transition: 'all 0.2s ease',
                  opacity: isVisible ? 0.8 : 0,
                  transitionDelay: `${1 + i * 0.1}s`,
                }}
              />
              
              {/* Hover tooltip */}
              {hoveredPoint === i && (
                <g style={{ animation: 'fadeInArea 0.2s ease' }}>
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={point.x}
                    y2={120}
                    stroke="rgba(34,197,94,0.4)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <rect
                    x={point.x - 35}
                    y={point.y - 35}
                    width={70}
                    height={28}
                    rx={8}
                    fill="rgba(0,0,0,0.9)"
                    stroke="rgba(34,197,94,0.5)"
                    strokeWidth="1"
                  />
                  <text
                    x={point.x}
                    y={point.y - 17}
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {point.value}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-white/30 -ml-7 py-1">
          <span>60K</span>
          <span>40K</span>
          <span>20K</span>
          <span>0</span>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-3 text-xs text-white/40 px-0">
        {incomeData.map((d, i) => (
          <span 
            key={i} 
            className={`transition-colors ${hoveredPoint === i ? 'text-white' : ''}`}
          >
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
});
AnimatedChart.displayName = "AnimatedChart";

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

      <div className="w-full max-w-6xl relative pb-20 px-4">
        {/* Multiple glow effects */}
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className="absolute left-1/4 top-0 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)" }}
          />
          <div
            className="absolute right-1/4 top-20 w-80 h-80 rounded-full blur-3xl opacity-15"
            style={{ background: "radial-gradient(ellipse at center, #3b82f6 0%, transparent 70%)" }}
          />
        </div>

        {/* Premium Dashboard Preview */}
        <div className="relative z-10" style={{ animation: "float 6s ease-in-out infinite" }}>
          <div 
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* macOS-style window bar */}
            <div className="px-5 py-4 flex items-center border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-inner" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-inner" />
                <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-inner" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-white/50 font-medium">finguru.app</span>
                </div>
              </div>
              <div className="w-16" />
            </div>
            
            {/* Dashboard content */}
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-white/40 text-sm mb-1">Good morning</p>
                  <h3 className="text-2xl font-semibold text-white">Financial Overview</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60">
                    Jan 2026
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                    ₹
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="col-span-1 p-5 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-xs text-green-400/80">+12.5%</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">₹2.4L</p>
                  <p className="text-xs text-white/40">Total Revenue</p>
                </div>
                
                <div className="col-span-1 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/40">47 entries</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">₹89.2K</p>
                  <p className="text-xs text-white/40">Expenses</p>
                </div>
                
                <div className="col-span-1 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-purple-400/80">ITC Ready</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">₹16.1K</p>
                  <p className="text-xs text-white/40">GST Claimable</p>
                </div>
                
                <div className="col-span-1 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs text-orange-400/80">AI Powered</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">94%</p>
                  <p className="text-xs text-white/40">Accuracy</p>
                </div>
              </div>

              {/* Chart and Recent */}
              <div className="grid grid-cols-3 gap-4">
                {/* Chart */}
                <div className="col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-medium text-white">Expense Trend</p>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span> Income</span>
                      <span className="flex items-center gap-1.5 text-white/40"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Expense</span>
                    </div>
                  </div>
                  
                  {/* Animated Interactive Chart */}
                  <AnimatedChart />
                </div>

                {/* Recent Entries */}
                <div className="col-span-1 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm font-medium text-white mb-4">Recent Entries</p>
                  <div className="space-y-3">
                    {[
                      { cat: "Food", amt: "₹450", icon: "🍽️", color: "bg-orange-500/20" },
                      { cat: "Transport", amt: "₹1,200", icon: "🚗", color: "bg-blue-500/20" },
                      { cat: "Office", amt: "₹3,500", icon: "📦", color: "bg-purple-500/20" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center text-sm`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{item.cat}</p>
                          <p className="text-xs text-white/40">Just now</p>
                        </div>
                        <p className="text-sm font-medium text-white">{item.amt}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
