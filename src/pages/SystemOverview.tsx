import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Home, Maximize, Minimize, ChevronLeft } from 'lucide-react';

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const slides = [
  // Slide 1: Title
  () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-[120px]">
      <div className="w-[140px] h-[140px] rounded-full bg-amber-500/20 flex items-center justify-center mb-[60px]">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <h1 className="text-[96px] font-bold tracking-tight text-center leading-tight">IGNIS Warranty System</h1>
      <p className="text-[40px] text-slate-400 mt-[30px]">How It Works — Team Overview</p>
      <div className="mt-[80px] flex items-center gap-[20px]">
        <div className="w-[80px] h-[4px] bg-amber-500 rounded-full" />
        <p className="text-[28px] text-slate-500">warrantystem.lovable.app</p>
        <div className="w-[80px] h-[4px] bg-amber-500 rounded-full" />
      </div>
    </div>
  ),

  // Slide 2: System Overview
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">System Overview</h2>
      <div className="w-[120px] h-[6px] bg-amber-500 rounded-full mb-[60px]" />
      <div className="flex-1 grid grid-cols-2 gap-[60px]">
        <div className="space-y-[40px]">
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[36px] font-semibold text-amber-400 mb-[16px]">🌐 What Is It?</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">A web-based warranty registration and management system for IGNIS products (EPC & LPG).</p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[36px] font-semibold text-emerald-400 mb-[16px]">👥 Two Sides</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed"><strong>Customer Side:</strong> Register warranty, view details</p>
            <p className="text-[28px] text-slate-300 leading-relaxed mt-[12px]"><strong>Admin Side:</strong> Manage serials, limits, view all warranties</p>
          </div>
        </div>
        <div className="space-y-[40px]">
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[36px] font-semibold text-blue-400 mb-[16px]">🔒 Security</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">Admin login required. Customer data protected. Serial numbers validated before registration.</p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[36px] font-semibold text-purple-400 mb-[16px]">📱 Access</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">Customers scan a QR code or visit the website directly. Works on any device with a browser.</p>
          </div>
        </div>
      </div>
    </div>
  ),

  // Slide 3: Customer Journey
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">Customer Journey</h2>
      <div className="w-[120px] h-[6px] bg-emerald-500 rounded-full mb-[60px]" />
      <div className="flex-1 flex items-center">
        <div className="w-full grid grid-cols-5 gap-[24px]">
          {[
            { step: '1', icon: '📱', title: 'Scan QR', desc: 'Customer scans QR code on product or visits website' },
            { step: '2', icon: '📋', title: 'Accept Policies', desc: 'Agree to Privacy Policy & Return/Refund Policy' },
            { step: '3', icon: '📝', title: 'Fill Form', desc: 'Name, Email, Phone, Product Type, Serial Number' },
            { step: '4', icon: '✅', title: 'Get Warranty', desc: 'System validates & creates 365-day warranty' },
            { step: '5', icon: '🔑', title: 'Access Code', desc: 'Unique code to view warranty details anytime' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-[100px] h-[100px] rounded-full bg-emerald-500/20 flex items-center justify-center text-[48px] mb-[24px]">
                {item.icon}
              </div>
              <div className="w-[48px] h-[48px] rounded-full bg-emerald-500 flex items-center justify-center text-[24px] font-bold mb-[16px]">
                {item.step}
              </div>
              <h4 className="text-[28px] font-semibold mb-[12px]">{item.title}</h4>
              <p className="text-[22px] text-slate-400 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  // Slide 4: Serial Number Validation
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">Serial Number Validation</h2>
      <div className="w-[120px] h-[6px] bg-blue-500 rounded-full mb-[60px]" />
      <div className="flex-1 grid grid-cols-2 gap-[80px] items-center">
        <div className="space-y-[40px]">
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-blue-400 mb-[20px]">Format</h3>
            <p className="text-[28px] text-slate-300 mb-[12px]">Prefix: <span className="font-mono bg-slate-700 px-[12px] py-[4px] rounded">IGN-EPC-6L-2601-</span></p>
            <p className="text-[28px] text-slate-300">Suffix (user enters): <span className="font-mono bg-slate-700 px-[12px] py-[4px] rounded">KE-001300</span></p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-amber-400 mb-[20px]">Rules</h3>
            <ul className="space-y-[16px] text-[26px] text-slate-300">
              <li className="flex items-start gap-[12px]"><span className="text-red-400 mt-[4px]">✗</span> Not found → "Check serial number"</li>
              <li className="flex items-start gap-[12px]"><span className="text-red-400 mt-[4px]">✗</span> Already used → "Already registered"</li>
              <li className="flex items-start gap-[12px]"><span className="text-emerald-400 mt-[4px]">✓</span> Valid & unused → Proceed to registration</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="bg-slate-800 rounded-[24px] p-[48px] border-2 border-blue-500/30 w-full">
            <p className="text-[24px] text-slate-500 mb-[8px]">Serial Number *</p>
            <div className="flex items-center gap-[4px]">
              <span className="text-[28px] text-slate-500 font-mono bg-slate-700/50 px-[16px] py-[12px] rounded-l-lg">IGN-EPC-6L-2601-</span>
              <span className="text-[28px] text-white font-mono bg-slate-600/50 px-[16px] py-[12px] rounded-r-lg border border-blue-500">KE-001300</span>
            </div>
            <p className="text-[22px] text-slate-500 mt-[16px]">↑ Customer only types the suffix</p>
          </div>
        </div>
      </div>
    </div>
  ),

  // Slide 5: Phone Number Limit System
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">Phone Number Limit System</h2>
      <div className="w-[120px] h-[6px] bg-red-500 rounded-full mb-[60px]" />
      <div className="flex-1 grid grid-cols-2 gap-[80px]">
        <div className="space-y-[36px]">
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-red-400 mb-[16px]">⚠️ The Rule</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">Each phone number can register a <strong>maximum of 2 warranties</strong> by default.</p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-amber-400 mb-[16px]">🔑 Key Point</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">Even if name and email are different, the system tracks by <strong>phone number only</strong>. Same phone = same count.</p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-emerald-400 mb-[16px]">🛠️ Admin Override</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">Admins can increase the limit for specific phone numbers (e.g., dealers or bulk buyers).</p>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center">
          <div className="bg-slate-800 rounded-[24px] p-[48px] border border-slate-700 w-full">
            <h4 className="text-[28px] font-semibold mb-[32px] text-center">Example Scenario</h4>
            <div className="space-y-[24px]">
              <div className="flex items-center justify-between bg-slate-700/50 rounded-[16px] p-[20px]">
                <div>
                  <p className="text-[24px]">📱 0723233309</p>
                  <p className="text-[20px] text-slate-400">Brian (brian@gmail.com)</p>
                </div>
                <span className="text-[28px] font-bold text-emerald-400">1st ✓</span>
              </div>
              <div className="flex items-center justify-between bg-slate-700/50 rounded-[16px] p-[20px]">
                <div>
                  <p className="text-[24px]">📱 0723233309</p>
                  <p className="text-[20px] text-slate-400">Mary (mary@gmail.com)</p>
                </div>
                <span className="text-[28px] font-bold text-amber-400">2nd ✓</span>
              </div>
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-[16px] p-[20px]">
                <div>
                  <p className="text-[24px]">📱 0723233309</p>
                  <p className="text-[20px] text-slate-400">John (john@gmail.com)</p>
                </div>
                <span className="text-[28px] font-bold text-red-400">3rd ✗ BLOCKED</span>
              </div>
            </div>
            <p className="text-[22px] text-slate-500 text-center mt-[24px]">Same phone → limit reached regardless of name/email</p>
          </div>
        </div>
      </div>
    </div>
  ),

  // Slide 6: Admin Dashboard
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">Admin Dashboard</h2>
      <div className="w-[120px] h-[6px] bg-amber-500 rounded-full mb-[60px]" />
      <div className="flex-1 grid grid-cols-3 gap-[40px]">
        {[
          { icon: '📊', title: 'Warranty Stats', desc: 'View total, active, and expired warranty counts at a glance.', color: 'text-blue-400' },
          { icon: '🔢', title: 'Serial Management', desc: 'Upload serial numbers in bulk (Excel) or add them one by one. Track used vs unused.', color: 'text-emerald-400' },
          { icon: '📱', title: 'Phone Limits', desc: 'Set custom warranty limits per phone number. See usage (e.g., 2/4) in real-time.', color: 'text-amber-400' },
          { icon: '📋', title: 'View All Warranties', desc: 'Search and browse all registered warranties. View full details for each.', color: 'text-purple-400' },
          { icon: '🔑', title: 'QR Code Access', desc: 'Download the registration QR code to print on products or marketing materials.', color: 'text-red-400' },
          { icon: '🗑️', title: 'Delete & Manage', desc: 'Remove warranties or serial numbers when needed. Full control over the system.', color: 'text-slate-400' },
        ].map((item, i) => (
          <div key={i} className="bg-slate-800/80 rounded-[24px] p-[36px] border border-slate-700 flex flex-col">
            <span className="text-[48px] mb-[20px]">{item.icon}</span>
            <h3 className={`text-[28px] font-semibold ${item.color} mb-[12px]`}>{item.title}</h3>
            <p className="text-[24px] text-slate-400 leading-snug">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  ),

  // Slide 7: Warranty Lifecycle
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">Warranty Lifecycle</h2>
      <div className="w-[120px] h-[6px] bg-emerald-500 rounded-full mb-[60px]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[1400px]">
          <div className="flex items-center justify-between mb-[80px]">
            {[
              { label: 'Registration', icon: '📝', color: 'bg-blue-500' },
              { label: 'Active (365 days)', icon: '✅', color: 'bg-emerald-500' },
              { label: 'Expiry', icon: '⏰', color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className={`w-[100px] h-[100px] ${item.color}/20 rounded-full flex items-center justify-center text-[48px] mb-[20px]`}>
                  {item.icon}
                </div>
                <p className="text-[28px] font-semibold">{item.label}</p>
                {i < 2 && (
                  <div className="absolute" style={{ display: 'none' }}>arrow</div>
                )}
              </div>
            ))}
          </div>
          <div className="relative h-[16px] bg-slate-700 rounded-full overflow-hidden mb-[32px]">
            <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
          </div>
          <div className="flex justify-between text-[24px] text-slate-400 mb-[60px]">
            <span>Day 0 — Activation</span>
            <span className="text-emerald-400 font-semibold">↑ ~Day 255 (70%)</span>
            <span>Day 365 — Expiry</span>
          </div>
          <div className="grid grid-cols-2 gap-[40px]">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[20px] p-[32px]">
              <h4 className="text-[28px] font-semibold text-emerald-400 mb-[12px]">🟢 Active Warranty</h4>
              <p className="text-[24px] text-slate-300">Green progress bar. Customer covered for repairs and support.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-[20px] p-[32px]">
              <h4 className="text-[28px] font-semibold text-red-400 mb-[12px]">🔴 Expired Warranty</h4>
              <p className="text-[24px] text-slate-300">Red indicator. Contact customer care at 0796595197 for assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  // Slide 8: QR Code & Access
  () => (
    <div className="flex flex-col h-full bg-slate-900 text-white px-[120px] py-[80px]">
      <h2 className="text-[64px] font-bold mb-[20px]">QR Code & Access</h2>
      <div className="w-[120px] h-[6px] bg-purple-500 rounded-full mb-[60px]" />
      <div className="flex-1 grid grid-cols-2 gap-[80px] items-center">
        <div className="space-y-[40px]">
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-purple-400 mb-[16px]">📱 QR Code</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">A QR code is available on the admin dashboard. It links directly to the warranty registration page.</p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-blue-400 mb-[16px]">🔐 Access Code</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed">After registration, each customer receives a unique access code. They use it on the "My Warranty" page to view their warranty details.</p>
          </div>
          <div className="bg-slate-800/80 rounded-[24px] p-[40px] border border-slate-700">
            <h3 className="text-[32px] font-semibold text-amber-400 mb-[16px]">🌐 Direct Link</h3>
            <p className="text-[28px] text-slate-300 leading-relaxed font-mono">warrantystem.lovable.app</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white rounded-[32px] p-[48px] shadow-2xl">
            <div className="w-[320px] h-[320px] bg-slate-200 rounded-[16px] flex items-center justify-center">
              <p className="text-[64px]">📱</p>
            </div>
          </div>
          <p className="text-[24px] text-slate-400 mt-[32px]">Scan → Register → Done!</p>
        </div>
      </div>
    </div>
  ),

  // Slide 9: Summary
  () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-[120px]">
      <h2 className="text-[72px] font-bold mb-[60px]">Quick Summary</h2>
      <div className="grid grid-cols-2 gap-[40px] max-w-[1400px] w-full mb-[60px]">
        {[
          { emoji: '📱', text: 'Customer scans QR → fills form → gets warranty' },
          { emoji: '🔢', text: 'Serial numbers are pre-uploaded by admin' },
          { emoji: '📞', text: 'Limit per phone number (default: 2)' },
          { emoji: '🛡️', text: '365-day warranty with progress tracking' },
          { emoji: '🔑', text: 'Access code for viewing warranty details' },
          { emoji: '⚙️', text: 'Admins can override limits for dealers' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-[24px] bg-slate-800/60 rounded-[20px] p-[28px] border border-slate-700">
            <span className="text-[40px]">{item.emoji}</span>
            <p className="text-[28px] text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-[20px] mt-[40px]">
        <div className="w-[60px] h-[4px] bg-amber-500 rounded-full" />
        <p className="text-[32px] text-amber-400 font-semibold">IGNIS Warranty System</p>
        <div className="w-[60px] h-[4px] bg-amber-500 rounded-full" />
      </div>
      <p className="text-[24px] text-slate-500 mt-[20px]">Support: 0796595197</p>
    </div>
  ),
];

export default function SystemOverview() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const total = slides.length;

  const updateScale = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const sx = rect.width / SLIDE_W;
    const sy = rect.height / SLIDE_H;
    setScale(Math.min(sx, sy));
  };

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isFullscreen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrent(c => Math.min(c + 1, total - 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrent(c => Math.max(c - 1, 0));
      }
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const SlideContent = slides[current];

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? 'h-screen bg-black' : 'min-h-screen bg-slate-950'}`}>
      {/* Top bar */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Button>
          </Link>
          <p className="text-slate-400 text-sm">Slide {current + 1} of {total}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-slate-400 hover:text-white">
              <Maximize className="w-4 h-4 mr-1" /> Present
            </Button>
          </div>
        </div>
      )}

      {/* Slide area */}
      <div ref={wrapperRef} className="flex-1 relative overflow-hidden flex items-center justify-center">
        <div
          style={{
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="absolute rounded-lg overflow-hidden shadow-2xl"
        >
          <SlideContent />
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex items-center justify-center gap-4 py-3 ${isFullscreen ? 'absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-6' : 'bg-slate-900 border-t border-slate-800'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrent(c => Math.max(c - 1, 0))}
          disabled={current === 0}
          className="text-slate-400 hover:text-white disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-amber-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrent(c => Math.min(c + 1, total - 1))}
          disabled={current === total - 1}
          className="text-slate-400 hover:text-white disabled:opacity-30"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        {isFullscreen && (
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-slate-400 hover:text-white ml-4">
            <Minimize className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
