import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, QrCode, Search, FileText, RefreshCw, Info } from 'lucide-react';

export default function Index() {
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [returnAgreed, setReturnAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-6">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Activate Warranty
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Welcome to the IGNIS Warranty Page — here we ensure your product is fully protected and supported.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Privacy Policy Card */}
          <Card 
            className="bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer hover:border-slate-600 transition-colors"
            onClick={() => setShowPrivacyDialog(true)}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Privacy Policy</CardTitle>
              <CardDescription className="text-slate-400">
                Click to read how we collect, use, and protect your personal data in line with Kenyan data protection laws.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Return & Refund Policy Card */}
          <Card 
            className="bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer hover:border-slate-600 transition-colors"
            onClick={() => setShowReturnDialog(true)}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Return & Refund Policy</CardTitle>
              <CardDescription className="text-slate-400">
                Click to read our full return conditions and refund process.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Warranty Information Card (Static) */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-amber-400" />
              </div>
              <CardTitle className="text-white">Warranty Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-400 text-sm mb-4">
                At IGNIS, we stand behind the quality of our products. Every appliance you purchase comes with a warranty that guarantees free service and support throughout the warranty period.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-white font-medium">How to Access Warranty Support</p>
                <ul className="text-slate-400 space-y-1">
                  <li>• SMS Support: Send the word HELP to [insert shortcode]</li>
                  <li>• WhatsApp: +254 700 XXX XXX</li>
                  <li>• Online Registration: Register your appliance using the form below</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/activate-warranty" state={{ privacyAgreed, returnAgreed }}>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
              <QrCode className="w-5 h-5 mr-2" />
              Activate Warranty
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

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">IGNIS Innovation — Privacy Policy</DialogTitle>
            <DialogDescription className="text-slate-400">
              Full Detail
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-6 py-4 text-slate-300">
            <section>
              <h3 className="text-white font-semibold mb-2">What personal data we collect</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Full name</li>
                <li>Phone number</li>
                <li>Email address</li>
                <li>Location</li>
                <li>Product serial number</li>
                <li>Purchase details</li>
                <li>Device information (IP address, browser, cookies, analytics data)</li>
                <li>Service records and support interactions</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Why we collect your data</h3>
              <p className="text-sm mb-2">We use your data to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Register and manage your product warranty</li>
                <li>Provide repairs and after-sales service</li>
                <li>Prevent fraud and misuse</li>
                <li>Improve our products and services</li>
                <li>Communicate with you about your warranty or service needs</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Do we sell your data?</h3>
              <p className="text-sm">👉 <strong>No.</strong> IGNIS does NOT sell your personal data.</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Who we share your data with</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Authorized service technicians</li>
                <li>Delivery and logistics partners</li>
                <li>Cloud hosting providers</li>
                <li>Legal or regulatory authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">How long we keep your data</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Warranty records → warranty period + 2 years</li>
                <li>Tax and accounting records → up to 7 years</li>
                <li>CCTV footage → 30–90 days</li>
                <li>Support records → 3–5 years after last interaction</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Your rights</h3>
              <p className="text-sm mb-2">You may:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Request access to your data</li>
                <li>Request correction of incorrect data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for marketing or communications</li>
              </ul>
            </section>

            <div className="flex items-center space-x-2 pt-4 border-t border-slate-700">
              <Checkbox 
                id="privacy-agree" 
                checked={privacyAgreed}
                onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
              />
              <label 
                htmlFor="privacy-agree" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the Privacy Policy
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowPrivacyDialog(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return & Refund Policy Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">IGNIS Innovation — Return & Refund Policy</DialogTitle>
            <DialogDescription className="text-slate-400">
              Full Detail
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-6 py-4 text-slate-300">
            <section>
              <h3 className="text-white font-semibold mb-2">Eligibility for Returns</h3>
              <p className="text-sm mb-2">A customer may return a product ONLY if:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>The product has a manufacturing defect</li>
                <li>The claim is made within 3 days of purchase</li>
                <li>The product is unused</li>
                <li>Proof of purchase is provided</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Products NOT eligible for return</h3>
              <p className="text-sm mb-2">Returns are NOT allowed for:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Products damaged due to misuse or mishandling</li>
                <li>Products that have been installed or used</li>
                <li>Products repaired by unauthorized technicians</li>
                <li>Clearance or customized items</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">If the product is defective</h3>
              <p className="text-sm mb-2">IGNIS will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Attempt to repair first</li>
                <li>If not repairable → replace</li>
                <li>Refund is last option only</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Who pays return shipping?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>If defect is our fault → IGNIS pays</li>
                <li>If customer misuse → customer pays</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">Refund timeline</h3>
              <p className="text-sm">
                Approved refunds processed within 14 business days via original payment method.
              </p>
            </section>

            <div className="flex items-center space-x-2 pt-4 border-t border-slate-700">
              <Checkbox 
                id="return-agree" 
                checked={returnAgreed}
                onCheckedChange={(checked) => setReturnAgreed(checked === true)}
              />
              <label 
                htmlFor="return-agree" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the Return & Refund Policy
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowReturnDialog(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
