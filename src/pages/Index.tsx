import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, QrCode, Search, Lock } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-6">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Activate Warrant
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Register, track, and manage your product warranties with ease. 
            Scan a QR code or enter your access details to get started.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-emerald-400" />
              </div>
              <CardTitle className="text-white">QR Code Activation</CardTitle>
              <CardDescription className="text-slate-400">
                Scan the QR code on your product to instantly activate your 365-day warranty
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Easy Access</CardTitle>
              <CardDescription className="text-slate-400">
                Use your name and phone number to view all your warranties anytime, anywhere
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <CardTitle className="text-white">Secure & Reliable</CardTitle>
              <CardDescription className="text-slate-400">
                Your warranty information is securely stored and easily accessible
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/activate-warranty">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
              <QrCode className="w-5 h-5 mr-2" />
              Activate Warrant
            </Button>
          </Link>
          <Link to="/my-warranty">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8">
              <Search className="w-5 h-5 mr-2" />
              View My Warranties
            </Button>
          </Link>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-16 pt-8 border-t border-slate-700">
          <Link 
            to="/admin/login" 
            className="text-slate-500 hover:text-slate-400 transition-colors text-sm"
          >
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
