import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Shield, 
  Search, 
  LogOut, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye,
  QrCode,
  Home,
  Upload,
  Plus,
  Hash
} from 'lucide-react';
import type { WarrantyWithDetails, Product } from '@/lib/supabase-types';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

interface SerialNumber {
  id: string;
  serial_number: string;
  status: 'used' | 'unused';
  warranty_id: string | null;
  created_at: string;
  used_at: string | null;
}

interface WarrantyOwner {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  access_code: string;
  warranty_limit: number;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyWithDetails[]>([]);
  const [filteredWarranties, setFilteredWarranties] = useState<WarrantyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats
  const [totalWarranties, setTotalWarranties] = useState(0);
  const [activeWarranties, setActiveWarranties] = useState(0);
  const [expiredWarranties, setExpiredWarranties] = useState(0);

  // Serial Numbers
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [totalSerials, setTotalSerials] = useState(0);
  const [usedSerials, setUsedSerials] = useState(0);
  const [unusedSerials, setUnusedSerials] = useState(0);
  const [showAddSerialDialog, setShowAddSerialDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSerialsListDialog, setShowSerialsListDialog] = useState(false);
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [addingSerial, setAddingSerial] = useState(false);
  const [uploadingSerials, setUploadingSerials] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete serial confirmation
  const [showDeleteSerialDialog, setShowDeleteSerialDialog] = useState(false);
  const [serialToDelete, setSerialToDelete] = useState<SerialNumber | null>(null);
  const [deletingSerial, setDeletingSerial] = useState(false);

  // Dialogs
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyWithDetails | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Warranty limit management (per owner in detail dialog)
  const [warrantyLimit, setWarrantyLimit] = useState<number>(2);
  const [savingLimit, setSavingLimit] = useState(false);

  // Global warranty limit setting
  const [globalWarrantyLimit, setGlobalWarrantyLimit] = useState<number>(2);
  const [savingGlobalLimit, setSavingGlobalLimit] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    // Filter warranties based on search query
    if (!searchQuery.trim()) {
      setFilteredWarranties(warranties);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = warranties.filter(w => 
        w.owner.full_name.toLowerCase().includes(query) ||
        w.owner.email.toLowerCase().includes(query) ||
        w.owner.phone.toLowerCase().includes(query) ||
        w.product.serial_number.toLowerCase().includes(query)
      );
      setFilteredWarranties(filtered);
    }
  }, [searchQuery, warranties]);

  const fetchData = async () => {
    try {
      // Fetch warranties with relations
      const { data: warrantiesData, error: warrantiesError } = await supabase
        .from('warranties')
        .select(`
          *,
          product:products(*),
          owner:warranty_owners(*)
        `)
        .order('created_at', { ascending: false });

      if (warrantiesError) throw warrantiesError;

      const typedWarranties = (warrantiesData as unknown as WarrantyWithDetails[]) || [];
      setWarranties(typedWarranties);
      setFilteredWarranties(typedWarranties);

      // Calculate stats
      const total = typedWarranties.length;
      const active = typedWarranties.filter(w => w.status === 'active').length;
      const expired = typedWarranties.filter(w => w.status === 'expired').length;

      setTotalWarranties(total);
      setActiveWarranties(active);
      setExpiredWarranties(expired);

      // Fetch serial numbers
      const { data: serialsData, error: serialsError } = await supabase
        .from('serial_numbers')
        .select('*')
        .order('created_at', { ascending: false });

      if (serialsError) {
        console.error('Error fetching serials:', serialsError);
      } else {
        const serials = (serialsData as SerialNumber[]) || [];
        setSerialNumbers(serials);
        setTotalSerials(serials.length);
        setUsedSerials(serials.filter(s => s.status === 'used').length);
        setUnusedSerials(serials.filter(s => s.status === 'unused').length);
      }

      // Fetch global warranty limit setting
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'default_warranty_limit')
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
      } else if (settingsData) {
        setGlobalWarrantyLimit(parseInt(settingsData.value) || 2);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalWarrantyLimit = async () => {
    setSavingGlobalLimit(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: globalWarrantyLimit.toString() })
        .eq('key', 'default_warranty_limit');

      if (error) throw error;

      toast.success('Global warranty limit updated successfully');
    } catch (error: any) {
      console.error('Error updating global warranty limit:', error);
      toast.error('Failed to update global warranty limit');
    } finally {
      setSavingGlobalLimit(false);
    }
  };

  const handleViewWarranty = async (warranty: WarrantyWithDetails) => {
    setSelectedWarranty(warranty);
    // Set the warranty limit from the owner
    const owner = warranty.owner as WarrantyOwner;
    setWarrantyLimit(owner.warranty_limit || 2);
    setShowDetailDialog(true);

    // Increment view count
    try {
      const { error } = await supabase
        .from('warranties')
        .update({ view_count: warranty.view_count + 1 })
        .eq('id', warranty.id);

      if (!error) {
        // Update local state
        setWarranties(prev => prev.map(w => 
          w.id === warranty.id ? { ...w, view_count: w.view_count + 1 } : w
        ));
      }
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const handleSaveWarrantyLimit = async () => {
    if (!selectedWarranty) return;

    setSavingLimit(true);
    try {
      const { error } = await supabase
        .from('warranty_owners')
        .update({ warranty_limit: warrantyLimit })
        .eq('id', selectedWarranty.owner.id);

      if (error) throw error;

      toast.success('Warranty limit updated successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error updating warranty limit:', error);
      toast.error('Failed to update warranty limit');
    } finally {
      setSavingLimit(false);
    }
  };

  const handleDeleteWarranty = async () => {
    if (!selectedWarranty) return;

    try {
      // Step 1: Reset any serial numbers linked to this warranty
      const { error: serialError } = await supabase
        .from('serial_numbers')
        .update({ 
          warranty_id: null, 
          status: 'unused',
          used_at: null 
        })
        .eq('warranty_id', selectedWarranty.id);

      if (serialError) {
        console.error('Error resetting serial number:', serialError);
        // Continue anyway - the serial might not exist
      }

      // Step 2: Delete the product associated with the warranty
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedWarranty.product.id);

      if (productError) {
        console.error('Error deleting product:', productError);
        // Continue anyway
      }

      // Step 3: Delete the warranty
      const { error: warrantyError } = await supabase
        .from('warranties')
        .delete()
        .eq('id', selectedWarranty.id);

      if (warrantyError) throw warrantyError;

      toast.success('Warranty deleted successfully.');
      setShowDeleteDialog(false);
      setShowDetailDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting warranty:', error);
      toast.error('Failed to delete warranty. Please try again.');
    }
  };

  const handleViewQR = async (product: Product) => {
    setSelectedProduct(product);
    
    // Generate QR code URL - using the existing static qr_code
    const activationUrl = `${window.location.origin}/activate-warranty/${product.id}`;
    try {
      const qrUrl = await QRCode.toDataURL(activationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
      setShowQRDialog(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleAddSerial = async () => {
    if (!newSerialNumber.trim()) {
      toast.error('Please enter a serial number');
      return;
    }

    setAddingSerial(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('add-serial', {
        body: { serialNumber: newSerialNumber },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add serial number');
      }

      toast.success('Serial number added successfully');
      setNewSerialNumber('');
      setShowAddSerialDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding serial:', error);
      toast.error(error.message || 'Failed to add serial number');
    } finally {
      setAddingSerial(false);
    }
  };

  const handleDeleteSerial = async () => {
    if (!serialToDelete) return;

    setDeletingSerial(true);
    try {
      const { error } = await supabase
        .from('serial_numbers')
        .delete()
        .eq('id', serialToDelete.id);

      if (error) throw error;

      toast.success('Serial number deleted permanently');
      setShowDeleteSerialDialog(false);
      setSerialToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting serial:', error);
      toast.error('Failed to delete serial number');
    } finally {
      setDeletingSerial(false);
    }
  };

  const confirmDeleteSerial = (serial: SerialNumber) => {
    setSerialToDelete(serial);
    setShowDeleteSerialDialog(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingSerials(true);
    try {
      const serialNumbers: string[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Handle CSV
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            serialNumbers.push(trimmed);
          }
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Handle Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        for (const row of data) {
          if (row[0]) {
            const value = String(row[0]).trim();
            if (value) {
              serialNumbers.push(value);
            }
          }
        }
      } else {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      if (serialNumbers.length === 0) {
        toast.error('No serial numbers found in file');
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('upload-serials', {
        body: { serialNumbers },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const results = response.data.results;
      toast.success(
        `Upload complete: ${results.added} added, ${results.duplicates} duplicates, ${results.invalid} invalid`
      );
      setShowUploadDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error uploading serials:', error);
      toast.error(error.message || 'Failed to upload serial numbers');
    } finally {
      setUploadingSerials(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Warranties</p>
                  <p className="text-3xl font-bold text-white">{totalWarranties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active Warranties</p>
                  <p className="text-3xl font-bold text-white">{activeWarranties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Expired Warranties</p>
                  <p className="text-3xl font-bold text-white">{expiredWarranties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Warranty Limit Setting */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Warranty Limit Per Phone Number
            </CardTitle>
            <CardDescription className="text-slate-400">
              Set the maximum number of warranties allowed per phone number for new registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="globalLimit" className="text-slate-300">Default Limit:</Label>
                <Input
                  id="globalLimit"
                  type="number"
                  min={1}
                  max={10}
                  value={globalWarrantyLimit}
                  onChange={(e) => setGlobalWarrantyLimit(parseInt(e.target.value) || 2)}
                  className="w-20 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handleSaveGlobalWarrantyLimit}
                disabled={savingGlobalLimit}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {savingGlobalLimit ? 'Saving...' : 'Save'}
              </Button>
              <span className="text-sm text-slate-400">
                (Currently: {globalWarrantyLimit} warranties per phone number)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Serial Number Management */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Serial Number Management
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage manufacturer serial numbers for warranty registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400">Total Serial Numbers</p>
                <p className="text-2xl font-bold text-white">{totalSerials}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400">Used</p>
                <p className="text-2xl font-bold text-red-400">{usedSerials}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400">Unused</p>
                <p className="text-2xl font-bold text-emerald-400">{unusedSerials}</p>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Serial Numbers
                </Button>
                <Button
                  onClick={() => setShowAddSerialDialog(true)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Serial Number
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setShowSerialsListDialog(true)}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              View All Serial Numbers →
            </Button>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or serial number..."
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warranties List */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Warranties</CardTitle>
            <CardDescription className="text-slate-400">
              {filteredWarranties.length} warranties found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWarranties.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {searchQuery ? 'No warranties found matching your search' : 'No warranties registered yet'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWarranties.map((warranty) => {
                  const daysRemaining = calculateDaysRemaining(warranty.expiry_date);
                  const isExpired = warranty.status === 'expired' || daysRemaining <= 0;

                  return (
                    <Card
                      key={warranty.id}
                      className="bg-slate-700/50 border-slate-600 cursor-pointer hover:border-slate-500 transition-colors"
                      onClick={() => handleViewWarranty(warranty)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{warranty.owner.full_name}</p>
                            <p className="text-sm text-slate-400">{warranty.product.product_type}</p>
                            <p className="text-xs text-slate-500">{warranty.product.serial_number}</p>
                          </div>
                          <Badge className={isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                            {isExpired ? 'Expired' : 'Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{isExpired ? 'Expired' : `${daysRemaining} days remaining`}</span>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewQR(warranty.product);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            View QR
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Warranty Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Warranty Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete warranty information
            </DialogDescription>
          </DialogHeader>
          {selectedWarranty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Owner Name</p>
                  <p className="text-white">{selectedWarranty.owner.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white">{selectedWarranty.owner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Phone</p>
                  <p className="text-white">{selectedWarranty.owner.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Product Type</p>
                  <p className="text-white">{selectedWarranty.product.product_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Serial Number</p>
                  <p className="text-white">{selectedWarranty.product.serial_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge className={selectedWarranty.status === 'expired' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                    {selectedWarranty.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Activation Date</p>
                  <p className="text-white">{new Date(selectedWarranty.activation_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Expiry Date</p>
                  <p className="text-white">{new Date(selectedWarranty.expiry_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">View Count</p>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <p className="text-white">{selectedWarranty.view_count} times</p>
                  </div>
                </div>
              </div>

              {/* Warranty Limit Override */}
              <div className="pt-4 border-t border-slate-700">
                <Label className="text-slate-400 text-sm">Warranty Limit (for this phone)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={warrantyLimit}
                    onChange={(e) => setWarrantyLimit(parseInt(e.target.value) || 2)}
                    className="w-24 bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleSaveWarrantyLimit}
                    disabled={savingLimit}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {savingLimit ? 'Saving...' : 'Save Limit'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Default is 2. Increase to allow more warranties for this phone number.
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Warranty Progress</span>
                  <span className={selectedWarranty.status === 'expired' ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedWarranty.status === 'expired' 
                      ? 'Expired' 
                      : `${calculateDaysRemaining(selectedWarranty.expiry_date)} days remaining`
                    }
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(selectedWarranty.activation_date, selectedWarranty.expiry_date)} 
                  className={`h-2 ${selectedWarranty.status === 'expired' ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Warranty Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Warranty</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to permanently delete this warranty? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWarranty}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Serial Number Confirmation Dialog */}
      <Dialog open={showDeleteSerialDialog} onOpenChange={setShowDeleteSerialDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Serial Number</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to permanently delete this serial number?
              <br />
              <span className="font-mono text-white">{serialToDelete?.serial_number}</span>
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteSerialDialog(false);
                setSerialToDelete(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSerial}
              disabled={deletingSerial}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingSerial ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Product QR Code</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedProduct?.product_type} - {selectedProduct?.serial_number}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="rounded-lg" />
            )}
            <p className="text-sm text-slate-400 mt-4 text-center">
              Scan this QR code to activate warranty for this product
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQRDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Serial Number Dialog */}
      <Dialog open={showAddSerialDialog} onOpenChange={setShowAddSerialDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Serial Number</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new serial number to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serial" className="text-slate-200">Serial Number</Label>
              <Input
                id="serial"
                value={newSerialNumber}
                onChange={(e) => setNewSerialNumber(e.target.value.toUpperCase())}
                placeholder="e.g. IGN-EPC-6L-2601-KE-001300"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Must be 5-50 alphanumeric characters or hyphens
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddSerialDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSerial}
              disabled={addingSerial}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addingSerial ? 'Adding...' : 'Add Serial Number'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Serial Numbers Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Upload Serial Numbers</DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload an Excel or CSV file containing serial numbers (one per row)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">
                Select a CSV or Excel file to upload
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingSerials}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {uploadingSerials ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              File format: One serial number per row. Example: IGN-EPC-6L-2601-KE-001300
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Serial Numbers List Dialog */}
      <Dialog open={showSerialsListDialog} onOpenChange={setShowSerialsListDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>All Serial Numbers</DialogTitle>
            <DialogDescription className="text-slate-400">
              {serialNumbers.length} serial numbers in system
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Serial Number</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Date Added</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serialNumbers.map((serial) => (
                  <tr key={serial.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white font-mono text-sm">{serial.serial_number}</td>
                    <td className="py-3 px-4">
                      <Badge className={serial.status === 'used' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                        {serial.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {new Date(serial.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => confirmDeleteSerial(serial)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSerialsListDialog(false)}
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
