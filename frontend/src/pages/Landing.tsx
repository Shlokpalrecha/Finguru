import { useNavigate } from 'react-router-dom';
import SaaSHero from '../components/ui/saas-hero';
import { motion } from 'framer-motion';
import { Receipt, Mic, Calculator, Shield, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const features = [
    {
      icon: Receipt,
      title: 'Smart Receipt Scanning',
      description: 'Upload receipts and let AI extract amounts, categories, and GST automatically',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Mic,
      title: 'Voice in Hinglish',
      description: 'Speak your expenses naturally — "Aaj chai ke 150 rupaye kharch hue"',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Calculator,
      title: 'GST Compliance',
      description: 'Automatic GST calculation with spec-driven Indian tax rules',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Human-in-the-Loop',
      description: 'AI explains every decision. You stay in control when confidence is low',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const steps = [
    { step: '01', title: 'Upload or Speak', desc: 'Scan a receipt or speak your expense in Hindi/English' },
    { step: '02', title: 'AI Processes', desc: 'GPT-4.1 extracts amount, category, applies GST rules' },
    { step: '03', title: 'Review & Confirm', desc: 'See the "Why?" explanation, confirm if needed' },
  ];

  return (
    <div className="bg-black min-h-screen">
      {/* SaaS Hero Section */}
      <SaaSHero onGetStarted={handleGetStarted} />

      {/* Features Section */}
      <section id="features" className="bg-black py-24 px-4 border-t border-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium text-sm">Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Not a Chatbot. A Reasoning Engine.
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              FinGuru uses constrained AI with spec-driven logic. Every decision is explainable, 
              every GST calculation is traceable.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-black to-gray-900 py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400">Simple, transparent, and always explainable</p>
          </motion.div>

          <div className="space-y-8">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start gap-6 group"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="about" className="bg-gray-900 py-24 px-4 border-t border-gray-800/50">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why FinGuru?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Spec-driven GST rules, not prompt tricks',
              'Every decision comes with a "Why?" explanation',
              'Human confirmation when AI is uncertain',
              'Works offline with local Whisper for voice',
              'Built for Indian MSMEs, not enterprise',
              'Open, transparent, no black-box AI',
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-300">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-24 px-4 border-t border-gray-800/50">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of Indian small businesses using AI-powered accounting 
              that's transparent, compliant, and actually helpful.
            </p>
            <motion.button
              onClick={handleGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white font-semibold py-4 px-8 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-green-500/25"
            >
              Start Using FinGuru
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">₹</span>
            </div>
            <span className="text-white font-semibold">FinGuru</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built for OpenAI Academy × NxtWave Buildathon
          </p>
        </div>
      </footer>
    </div>
  );
}
