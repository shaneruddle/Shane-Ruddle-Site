import { motion } from "motion/react";
import { ArrowLeft, Shield } from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-black/40 hover:text-gold transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-4xl font-serif">Privacy Policy</h1>
              <p className="text-xs uppercase tracking-widest text-black/40 mt-1">Last Updated: April 2026</p>
            </div>
          </div>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">1. Introduction</h2>
            <p>
              Welcome to Shane Ruddle Enterprises. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">2. The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
            </ul>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To register you as a new client or employee.</li>
              <li>To process and deliver our services.</li>
              <li>To manage our relationship with you.</li>
              <li>To improve our website, services, marketing and client relationships.</li>
            </ul>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">5. Your Legal Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, and the right to withdraw consent.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us via the contact form on our website.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
