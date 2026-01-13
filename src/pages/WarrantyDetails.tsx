import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, Calendar, Clock, Package, ArrowLeft, CheckCircle } from 'lucide-react';
import type { WarrantyWithDetails } from '@/lib/supabase-types';

export default function WarrantyDetails() {
  const { warrantyId } = useParams<{ warrantyId: string }>();
  const navigate = useNavigate();
  const [warranty, setWarranty] = useState<WarrantyWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarranty = async () => {
      if (!warrantyId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('warranties')
          .select(`
            *,
            product:products(*),
            owner:warranty_owners(*)
          `)
          .eq('id', warrantyId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast.error('Warranty not found');
          navigate('/');
          return;
        }

        setWarranty(data as unknown as WarrantyWithDetails);
      } catch (error: any) {
        console.error('Error fetching warranty:', error);
        toast.error('Failed to load warranty details');
      } finally {
        setLoading(false);
      }
    };

    fetchWarranty();
  }, [warrantyId, navigate]);

  const calculateDaysRemaining = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateProgress = (activationDate: string, expiryDate: string): number => {
    const activation = new Date(activationDate);
    const expiry = new Date(expiryDate);
    const today = new Date();
    
    const totalDays = (expiry.getTime() - activation.getTime()) / (1000 * 60 * 60 * 24);
    const daysUsed = (today.getTime() - activation.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!warranty) {
    return null;
  }

  const daysRemaining = calculateDaysRemaining(warranty.expiry_date);
  const progress = calculateProgress(warranty.activation_date, warranty.expiry_date);
  const isExpired = warranty.status === 'expired' || daysRemaining <= 0;
  const daysUsed = Math.round((progress / 100) * 365);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Warranty Activated!</h1>
          <p className="text-slate-400">Your product warranty has been successfully registered</p>
        </div>

        {/* Warranty Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${isExpired ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                  <Package className={`w-6 h-6 ${isExpired ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    {warranty.product.product_type} Product
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Serial: {warranty.product.serial_number}
                  </CardDescription>
                </div>
              </div>
              <Badge className={`text-sm ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isExpired ? 'Expired' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Owner Info */}
            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Owner Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white ml-2">{warranty.owner.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white ml-2">{warranty.owner.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-white ml-2">{warranty.owner.phone}</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">Activation Date</p>
                  <p className="text-white font-medium">{new Date(warranty.activation_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs text-slate-400">Expiry Date</p>
                  <p className="text-white font-medium">{new Date(warranty.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300 font-medium">Warranty Progress</span>
                <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isExpired ? 'Expired' : `${Math.max(0, daysRemaining)} days remaining`}
                </span>
              </div>
              <Progress 
                value={progress} 
                className={`h-3 ${isExpired ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
              />
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{daysUsed} / 365 days used</span>
                <span className="text-slate-400">{Math.round(progress)}% complete</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium">Need Help?</p>
                  <p className="text-sm text-slate-300 mt-1">
                    For anything you need to access your warranty, kindly contact us at <span className="text-amber-400 font-medium">0796595197</span>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/my-warranty">
            <Button variant="outline" className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-700">
              <Shield className="w-4 h-4 mr-2" />
              View All My Warranties
            </Button>
          </Link>
          <Link to="/">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
