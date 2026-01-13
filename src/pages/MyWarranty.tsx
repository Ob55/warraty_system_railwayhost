import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Search, Calendar, Clock, Package, ArrowLeft } from 'lucide-react';
import type { WarrantyWithDetails } from '@/lib/supabase-types';

export default function MyWarranty() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [warranties, setWarranties] = useState<WarrantyWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Please enter both your full name and phone number');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Find the warranty owner by full name AND phone
      const { data: owners, error: ownerError } = await supabase
        .from('warranty_owners')
        .select('*')
        .ilike('full_name', `%${fullName.trim()}%`)
        .ilike('phone', `%${phone.trim()}%`);

      if (ownerError) {
        throw ownerError;
      }

      if (!owners || owners.length === 0) {
        setWarranties([]);
        toast.error('No warranties found');
        return;
      }

      // Get all owner IDs
      const ownerIds = owners.map(o => o.id);

      // Fetch all warranties for these owners
      const { data: warrantiesData, error: warrantiesError } = await supabase
        .from('warranties')
        .select(`
          *,
          product:products(*),
          owner:warranty_owners(*)
        `)
        .in('owner_id', ownerIds)
        .order('created_at', { ascending: false });

      if (warrantiesError) {
        throw warrantiesError;
      }

      setWarranties((warrantiesData as unknown as WarrantyWithDetails[]) || []);
      
      if (warrantiesData && warrantiesData.length > 0) {
        toast.success(`Found ${warrantiesData.length} warranty(ies)`);
      }
    } catch (error: any) {
      console.error('Error fetching warranties:', error);
      toast.error('Failed to fetch warranties');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">My Warranties</h1>
          <p className="text-slate-400">Enter your name and phone number to view your warranties</p>
        </div>

        {/* Search Section */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white text-lg">Search Warranties</CardTitle>
            <CardDescription className="text-slate-400">
              Enter the details you used when registering your warranty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-200">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-200">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Warranties
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Warranties List */}
        {searched && (
          <>
            {warranties.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No warranties found</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Make sure you entered the same name and phone number used during registration
                  </p>
                  <Link to="/activate-warranty">
                    <Button variant="link" className="text-emerald-400">
                      Register a new warranty
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {warranties.map((warranty) => {
                  const daysRemaining = calculateDaysRemaining(warranty.expiry_date);
                  const progress = calculateProgress(warranty.activation_date, warranty.expiry_date);
                  const isExpired = warranty.status === 'expired' || daysRemaining <= 0;

                  return (
                    <Card key={warranty.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                              <Package className={`w-5 h-5 ${isExpired ? 'text-red-400' : 'text-emerald-400'}`} />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg">
                                {warranty.product.product_type} Product
                              </CardTitle>
                              <CardDescription className="text-slate-400">
                                Serial: {warranty.product.serial_number}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                            {isExpired ? 'Expired' : 'Active'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Activated: {new Date(warranty.activation_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>Expires: {new Date(warranty.expiry_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Warranty Progress</span>
                            <span className={isExpired ? 'text-red-400' : 'text-emerald-400'}>
                              {isExpired ? 'Expired' : `${Math.max(0, daysRemaining)} days remaining`}
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className={`h-2 ${isExpired ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{Math.round(progress)}% used</span>
                            <span>365 days total</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer Links */}
        <div className="text-center mt-8">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
