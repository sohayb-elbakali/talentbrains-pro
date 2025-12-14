import { Brain, Envelope, Phone, MapPin, TwitterLogo, LinkedinLogo, GithubLogo, FacebookLogo } from '@phosphor-icons/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Brain size={20} weight="regular" className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                TalentBrains
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connecting top talent with innovative companies through AI-powered matching.
              Building the future of work, one perfect match at a time.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <TwitterLogo size={20} weight="regular" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <LinkedinLogo size={20} weight="regular" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <GithubLogo size={20} weight="regular" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <FacebookLogo size={20} weight="regular" />
              </a>
            </div>
          </div>

          {/* For Talents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Talents</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Browse Jobs
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Create Profile
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Skill Assessment
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Career Resources
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* For Companies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Companies</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Post Jobs
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Find Talent
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Hiring Solutions
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Enterprise
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Envelope size={16} weight="regular" className="text-primary" />
                <span className="text-slate-400">hello@talentbrains.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} weight="regular" className="text-primary" />
                <span className="text-slate-400">+212 612345678</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} weight="regular" className="text-primary" />
                <span className="text-slate-400">Rabat, Morocco</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-semibold text-white mb-2">Stay Updated</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-l-lg text-white text-sm focus:outline-none focus:border-primary placeholder-slate-500"
                />
                <button className="px-4 py-2 bg-primary hover:bg-blue-700 rounded-r-lg transition-colors text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="text-sm text-slate-400">
              © {currentYear} TalentBrains. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}