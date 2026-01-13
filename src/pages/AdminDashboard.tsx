import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Plus
} from 'lucide-react';
import type { WarrantyWithDetails, Product, ProductType } from '@/lib/supabase-types';
import QRCode from 'qrcode';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyWithDetails[]>([]);
  const [filteredWarranties, setFilteredWarranties] = useState<WarrantyWithDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats
  const [totalWarranties, setTotalWarranties] = useState(0);
  const [activeWarranties, setActiveWarranties] = useState(0);
  const [expiredWarranties, setExpiredWarranties] = useState(0);

  // Dialogs
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyWithDetails | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // New product form
  const [newProduct, setNewProduct] = useState({
    productType: 'EPC' as ProductType,
    serialNumber: ''
  });

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
        w.owner.phone.toLowerCase().includes(query)
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

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts((productsData as Product[]) || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWarranty = async (warranty: WarrantyWithDetails) => {
    setSelectedWarranty(warranty);
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

  const handleDeleteWarranty = async () => {
    if (!selectedWarranty) return;

    try {
      const { error } = await supabase
        .from('warranties')
        .delete()
        .eq('id', selectedWarranty.id);

      if (error) throw error;

      toast.success('Warranty deleted permanently');
      setShowDeleteDialog(false);
      setShowDetailDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting warranty:', error);
      toast.error('Failed to delete warranty');
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

  const handleAddProduct = async () => {
    if (!newProduct.serialNumber.trim()) {
      toast.error('Please enter a serial number');
      return;
    }

    try {
      // Generate a static QR code that never changes
      const qrCode = `product-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { error } = await supabase
        .from('products')
        .insert({
          product_type: newProduct.productType,
          serial_number: newProduct.serialNumber,
          qr_code: qrCode
        });

      if (error) throw error;

      toast.success('Product added successfully');
      setShowAddProductDialog(false);
      setNewProduct({ productType: 'EPC', serialNumber: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('A product with this serial number already exists');
      } else {
        toast.error('Failed to add product');
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
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
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

        {/* Products Section */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Products</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage products and their QR codes
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddProductDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No products yet. Add your first product to generate QR codes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{product.product_type}</p>
                      <p className="text-sm text-slate-400">{product.serial_number}</p>
                    </div>
                    <Button
                      onClick={() => handleViewQR(product)}
                      variant="ghost"
                      size="sm"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      View QR
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
                placeholder="Search by name, email, or phone..."
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
                          </div>
                          <Badge className={isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                            {isExpired ? 'Expired' : 'Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>{isExpired ? 'Expired' : `${daysRemaining} days remaining`}</span>
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
                  <p className="text-sm text-slate-400">Access Code</p>
                  <p className="text-white font-mono">****{selectedWarranty.owner.access_code.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">View Count</p>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <p className="text-white">{selectedWarranty.view_count} times</p>
                  </div>
                </div>
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

      {/* Delete Confirmation Dialog */}
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

      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new product with a static QR code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Product Type</label>
              <select
                value={newProduct.productType}
                onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value as ProductType })}
                className="w-full p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
              >
                <option value="EPC">EPC</option>
                <option value="LPG">LPG</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Serial Number</label>
              <Input
                value={newProduct.serialNumber}
                onChange={(e) => setNewProduct({ ...newProduct, serialNumber: e.target.value })}
                placeholder="Enter serial number"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddProductDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
