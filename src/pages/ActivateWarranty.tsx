import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import type { Product, ProductType } from '@/lib/supabase-types';

export default function ActivateWarranty() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    productType: '' as ProductType | '',
    serialNumber: ''
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
        setFormData(prev => ({
          ...prev,
          productType: data.product_type as ProductType,
          serialNumber: data.serial_number
        }));
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  // Access code generation is now handled by backend

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.productType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Call backend edge function to register warranty (bypasses RLS)
      const response = await supabase.functions.invoke('register-warranty', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          productType: formData.productType,
          serialNumber: formData.serialNumber,
          productId: productId
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to register warranty');
      }

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to register warranty');
      }

      toast.success('Warranty registered successfully!');
      
      // Redirect to warranty details page
      navigate(`/warranty-details/${data.warranty.id}`);
    } catch (error: any) {
      console.error('Error registering warranty:', error);
      toast.error(error.message || 'Failed to register warranty');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Activate Warrant</h1>
          <p className="text-slate-400">Register your product to activate the 365-day warranty</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Product Registration</CardTitle>
            <CardDescription className="text-slate-400">
              Fill in your details to activate your warranty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-200">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-200">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productType" className="text-slate-200">Product Type *</Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value: ProductType) => setFormData({ ...formData, productType: value })}
                  disabled={!!product}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="EPC" className="text-white">EPC</SelectItem>
                    <SelectItem value="LPG" className="text-white">LPG</SelectItem>
                    <SelectItem value="OTHER" className="text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-slate-200">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Enter serial number (optional)"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  disabled={!!product}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Link to="/" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
      </div>
    </div>
  );
}
