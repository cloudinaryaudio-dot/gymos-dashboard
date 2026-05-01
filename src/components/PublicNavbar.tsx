import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Menu, X } from 'lucide-react';

export interface NavbarConfig {
  logo_url?: string;
  brand_name?: string;
  cta_text?: string;
  cta_link?: string;
  show_dashboard_link?: boolean;
}

interface NavLink {
  label: string;
  id: string;
}

interface PublicNavbarProps {
  config?: NavbarConfig;
  brandName?: string;
  brandLogo?: string | null;
  navLinks: NavLink[];
  onScrollTo: (id: string) => void;
}

export function PublicNavbar({ config, brandName = 'GymOS', brandLogo, navLinks, onScrollTo }: PublicNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const logo = config?.logo_url || brandLogo;
  const name = config?.brand_name || brandName;
  const ctaText = config?.cta_text || 'Join Now';
  const ctaLink = config?.cta_link || 'lead-form';
  const showDashboard = config?.show_dashboard_link !== false;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (id: string) => {
    setMobileOpen(false);
    onScrollTo(id);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-ws-darker/95 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-ws-border-dim'
          : 'bg-transparent'
      } ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
        {/* Logo */}
        <button onClick={() => handleNav('hero')} className="flex items-center gap-3 group">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="h-10 w-10 rounded-xl object-cover shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-highlight flex items-center justify-center shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <span className="text-xl font-bold font-display tracking-tight text-ws-text">{name}</span>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link, i) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="text-ws-text hover:text-ws-text transition-colors duration-200 relative group"
              style={{
                animation: mounted ? `nav-item-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.06}s both` : undefined,
              }}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div
          className="hidden md:flex items-center gap-3"
          style={{ animation: mounted ? 'nav-item-enter 0.4s cubic-bezier(0.22,1,0.36,1) 0.5s both' : undefined }}
        >
          <Button
            size="sm"
            className="h-10 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] transition-all duration-200"
            onClick={() => handleNav(ctaLink)}
          >
            {ctaText}
          </Button>
          {showDashboard && (
            <Link to="/app/dashboard">
              <Button
                size="sm"
                variant="ghost"
                className="h-10 px-4 text-ws-text hover:text-ws-text hover:bg-ws-border-dim rounded-xl transition-all duration-200"
              >
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-ws-text-muted hover:text-ws-text transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="relative h-6 w-6">
            <Menu className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${mobileOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
            <X className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-y-auto transition-all duration-400 ${
          mobileOpen ? 'max-h-[calc(100vh-4.5rem)] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="bg-ws-card-alt border-t border-ws-border-dim px-6 pt-6 pb-8 flex flex-col gap-2">
          {navLinks.map((link, i) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="block w-full text-left text-ws-text-label hover:text-ws-text hover:bg-ws-border-dim py-3 px-4 text-lg font-medium rounded-xl transition-all duration-200"
              style={{
                animation: mobileOpen ? `nav-mobile-enter 0.3s ease-out ${i * 0.05}s both` : undefined,
              }}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-4 space-y-3">
            <Button
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => handleNav(ctaLink)}
            >
              {ctaText}
            </Button>
            {showDashboard && (
              <Link to="/app/dashboard" className="block">
                <Button variant="outline" className="w-full h-12 rounded-xl border-ws-border bg-transparent text-ws-text-label hover:bg-ws-border-dim">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nav-item-enter {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nav-mobile-enter {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </nav>
  );
}
