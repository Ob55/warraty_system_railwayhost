import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Shield, CheckCircle, ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import type { Product, ProductType } from '@/lib/supabase-types';

const SERIAL_PREFIX = 'IGN-EPC-6L-2601-';

export default function ActivateWarranty() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Get initial checkbox state from navigation (if coming from Index)
  const initialState = location.state as { privacyAgreed?: boolean; returnAgreed?: boolean } | null;
  const [privacyAgreed, setPrivacyAgreed] = useState(initialState?.privacyAgreed ?? false);
  const [returnAgreed, setReturnAgreed] = useState(initialState?.returnAgreed ?? false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [glowCards, setGlowCards] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    productType: '' as ProductType | '',
    serialSuffix: '' // Only the suffix part (after prefix)
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product information');
      } else if (data) {
        setProduct(data as Product);
        // If the serial number starts with the prefix, extract the suffix
        const serialNumber = data.serial_number;
        const suffix = serialNumber.startsWith(SERIAL_PREFIX) 
          ? serialNumber.substring(SERIAL_PREFIX.length)
          : serialNumber;
        setFormData(prev => ({
          ...prev,
          productType: data.product_type as ProductType,
          serialSuffix: suffix
        }));
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only uppercase alphanumeric and hyphens for suffix
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setFormData({ ...formData, serialSuffix: value });
  };

  const parseErrorMessage = (error: any): string => {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Check for specific error patterns and return user-friendly messages
    if (errorMessage.includes('warranty limit') || errorMessage.includes('maximum allowed')) {
      return 'Your phone number has reached the maximum allowed warranties. Please contact support to increase your limit.';
    }
    if (errorMessage.includes('Invalid serial') || errorMessage.includes('not found')) {
      return 'Kindly check the serial number and try again.';
    }
    if (errorMessage.includes('already registered') || errorMessage.includes('already used') || errorMessage.includes('already been registered')) {
      return 'This serial number has already been registered.';
    }
    if (errorMessage.includes('non-2xx status code') || errorMessage.includes('edge function')) {
      return 'Unable to process your request. Please try again or contact support.';
    }
    
    return errorMessage || 'Failed to register warranty. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if both policies are agreed
    if (!privacyAgreed || !returnAgreed) {
      setGlowCards(true);
      toast.error('Kindly check the Privacy Policy and Return & Refund Policy to proceed.');
      setTimeout(() => setGlowCards(false), 2000);
      return;
    }
    
    // Combine prefix and suffix to get full serial number
    const fullSerialNumber = SERIAL_PREFIX + formData.serialSuffix;
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.productType || !formData.serialSuffix) {
      toast.error('Please fill in all required fields including serial number');
      return;
    }

    // Disable submit button during validation
    setSubmitting(true);

    try {
      // Call backend edge function to register warranty (bypasses RLS)
      const response = await supabase.functions.invoke('register-warranty', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          productType: formData.productType,
          serialNumber: fullSerialNumber,
          productId: productId
        }
      });

      if (response.error) {
        const friendlyMessage = parseErrorMessage(response.error);
        throw new Error(friendlyMessage);
      }

      const data = response.data;
      
      if (!data.success) {
        const friendlyMessage = parseErrorMessage({ message: data.error });
        throw new Error(friendlyMessage);
      }

      toast.success('Warranty registered successfully!');
      
      // Redirect to warranty details page
      navigate(`/warranty-details/${data.warranty.id}`);
    } catch (error: any) {
      console.error('Error registering warranty:', error);
      toast.error(parseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const bothPoliciesAgreed = privacyAgreed && returnAgreed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-3">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Activate Warranty</h1>
          <p className="text-slate-400 text-sm">
            Welcome to the IGNIS Warranty Page — here we ensure your product is fully protected and supported.
          </p>
        </div>

        {/* Policy Agreement Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card 
            className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer hover:border-slate-600 transition-all ${
              glowCards && !privacyAgreed ? 'ring-2 ring-amber-500 animate-pulse' : ''
            } ${privacyAgreed ? 'border-emerald-500/50' : ''}`}
            onClick={() => setShowPrivacyDialog(true)}
          >
            <CardHeader className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                {privacyAgreed && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>
              <CardTitle className="text-white text-sm">Privacy Policy</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Click to read and agree
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer hover:border-slate-600 transition-all ${
              glowCards && !returnAgreed ? 'ring-2 ring-amber-500 animate-pulse' : ''
            } ${returnAgreed ? 'border-emerald-500/50' : ''}`}
            onClick={() => setShowReturnDialog(true)}
          >
            <CardHeader className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </div>
                {returnAgreed && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>
              <CardTitle className="text-white text-sm">Return & Refund</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Click to read and agree
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Instructional message when policies not accepted */}
        {!bothPoliciesAgreed && (
          <Card className="bg-amber-500/10 border-amber-500/30 backdrop-blur-sm mb-4">
            <CardContent className="py-4">
              <p className="text-amber-400 text-sm text-center font-medium">
                Kindly accept the Privacy Policy and Return & Refund Policy to proceed with product registration.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Product Registration Form - Only visible when both policies are accepted */}
        {bothPoliciesAgreed && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Product Registration</CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Fill in your details to activate your warranty
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-slate-200 text-sm">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-200 text-sm">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-slate-200 text-sm">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="productType" className="text-slate-200 text-sm">Product Type *</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value: ProductType) => setFormData({ ...formData, productType: value })}
                    disabled={!!product}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-9">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="EPC" className="text-white">EPC</SelectItem>
                      <SelectItem value="LPG" className="text-white">LPG</SelectItem>
                      <SelectItem value="OTHER" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="serialNumber" className="text-slate-200 text-sm">Serial Number *</Label>
                  <div className="flex">
                    <div className="flex items-center bg-slate-600 border border-slate-600 rounded-l-md px-2 text-slate-300 text-xs font-mono">
                      {SERIAL_PREFIX}
                    </div>
                    <Input
                      id="serialNumber"
                      value={formData.serialSuffix}
                      onChange={handleSerialChange}
                      placeholder="KE-001300"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 rounded-l-none font-mono h-9"
                      required
                      disabled={!!product}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter the ending part of your serial number
                  </p>
                </div>

                <div className="flex gap-3 pt-3">
                  <Link to="/" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 h-9"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Registering...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Register Warranty
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
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