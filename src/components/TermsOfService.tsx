import { motion } from "motion/react";
import { ArrowLeft, FileText } from "lucide-react";

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
              <FileText className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-4xl font-serif">Terms of Service</h1>
              <p className="text-xs uppercase tracking-widest text-black/40 mt-1">Last Updated: April 2026</p>
            </div>
          </div>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">2. Use of the Site</h2>
            <p>
              You are granted a non-exclusive, non-transferable, revocable license to access and use the site strictly in accordance with these terms of use. As a condition of your use of the site, you warrant to Shane Ruddle Enterprises that you will not use the site for any purpose that is unlawful or prohibited by these terms.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">3. Intellectual Property</h2>
            <p>
              All content included as part of the service, such as text, graphics, logos, images, as well as the compilation thereof, and any software used on the site, is the property of Shane Ruddle Enterprises or its suppliers and protected by copyright and other laws that protect intellectual property and proprietary rights.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">4. Indemnification</h2>
            <p>
              You agree to indemnify, defend and hold harmless Shane Ruddle Enterprises, its officers, directors, employees, agents and third parties, for any losses, costs, liabilities and expenses relating to or arising out of your use of or inability to use the site or services.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">5. Liability Disclaimer</h2>
            <p>
              The information, software, products, and services included in or available through the site may include inaccuracies or typographical errors. Changes are periodically added to the information herein. Shane Ruddle Enterprises and/or its suppliers may make improvements and/or changes in the site at any time.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">6. Termination/Access Restriction</h2>
            <p>
              Shane Ruddle Enterprises reserves the right, in its sole discretion, to terminate your access to the site and the related services or any portion thereof at any time, without notice.
            </p>
          </section>

          <section className="space-y-6 text-black/60 font-light leading-relaxed">
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">7. Governing Law</h2>
            <p>
              To the maximum extent permitted by law, this agreement is governed by the laws of Thailand and you hereby consent to the exclusive jurisdiction and venue of courts in Thailand in all disputes arising out of or relating to the use of the site.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
