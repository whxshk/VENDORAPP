import { useState } from 'react';
import { useMerchantSettings, useUpdateMerchantSettings, useCreateLocation } from '../../hooks/useMerchant';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { isDemoMode } from '../../config/env';
import { Building2, Key, Info } from 'lucide-react';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type LocationFormData = z.infer<typeof locationSchema>;

type MerchantFormData = {
  name: string;
  description: string;
};

export default function SettingsPage() {
  const { data: merchant, isLoading } = useMerchantSettings();
  const updateMerchant = useUpdateMerchantSettings();
  const createLocation = useCreateLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantFormData>({
    defaultValues: {
      name: merchant?.name || '',
      description: merchant?.description || '',
    },
    values: merchant ? {
      name: merchant.name,
      description: merchant.description || '',
    } : undefined,
  });

  const {
    register: registerLocation,
    handleSubmit: handleSubmitLocation,
    formState: { errors: locationErrors },
    reset: resetLocation,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = (data: MerchantFormData) => {
    updateMerchant.mutate(data, {
      onSuccess: () => {
        // Show success message
      },
      onError: (error: Error) => {
        alert(`Failed to update settings: ${error.message || 'Unknown error'}`);
      },
    });
  };

  const onSubmitLocation = (data: LocationFormData) => {
    createLocation.mutate(data, {
      onSuccess: () => {
        setIsBranchDialogOpen(false);
        resetLocation();
      },
      onError: (error: Error) => {
        alert(`Failed to create branch: ${error.message || 'Unknown error'}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your merchant account settings</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your merchant account settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Merchant Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Merchant Name</label>
                  <Input {...register('name', { required: 'Name is required' })} />
                  {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Description</label>
                  <Input {...register('description')} placeholder="Brief description of your business" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Logo</label>
                  <div className="border border-white/10 rounded-lg p-8 text-center text-slate-400 bg-slate-800/30">
                    Logo upload coming soon
                  </div>
                </div>

                <Button type="submit" disabled={updateMerchant.isPending}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Branches</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBranchDialogOpen(true)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {merchant?.branches.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-sm">No branches added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {merchant?.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{branch.name}</div>
                        {branch.address && (
                          <div className="text-sm text-slate-400 mt-1">{branch.address}</div>
                        )}
                      </div>
                      <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <Key className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400 text-lg">API keys coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Info className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400 text-lg mb-2">Feature Management</p>
                <p className="text-slate-500 text-sm">Coming soon</p>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Email Notifications', description: 'Send email notifications to customers' },
                  { name: 'SMS Notifications', description: 'Send SMS notifications to customers' },
                  { name: 'Auto Points Expiry', description: 'Automatically expire points after a set period' },
                  { name: 'Birthday Rewards', description: 'Automatically issue rewards on customer birthdays' },
                  { name: 'Referral Program', description: 'Reward customers for referring new members' },
                ].map((feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30"
                  >
                    <div>
                      <div className="font-semibold text-white">{feature.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{feature.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="opacity-50">Coming Soon</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-5 rounded-xl border border-white/5 bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <Info className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="font-semibold text-white">Demo Mode</div>
                    <div className="text-sm text-slate-400 mt-1">
                      Current mode: {isDemoMode() ? 'Demo (Mock Data)' : 'Production (Real API)'}
                    </div>
                  </div>
                </div>
                <Badge variant={isDemoMode() ? 'warning' : 'success'}>
                  {isDemoMode() ? 'DEMO' : 'PRODUCTION'}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Demo mode is controlled by the VITE_DEMO_MODE environment variable. 
                Change it in your .env file and restart the development server.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Branch Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogClose onClose={() => {
              setIsBranchDialogOpen(false);
              resetLocation();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmitLocation(onSubmitLocation)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                {...registerLocation('name')}
                placeholder="Main Branch"
              />
              {locationErrors.name && (
                <p className="text-sm text-red-400 mt-1">{locationErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Address <span className="text-red-400">*</span>
              </label>
              <Input
                {...registerLocation('address')}
                placeholder="123 Main Street"
              />
              {locationErrors.address && (
                <p className="text-sm text-red-400 mt-1">{locationErrors.address.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">City</label>
              <Input
                {...registerLocation('city')}
                placeholder="Doha"
              />
              {locationErrors.city && (
                <p className="text-sm text-red-400 mt-1">{locationErrors.city.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Phone</label>
              <Input
                {...registerLocation('phone')}
                placeholder="+974 1234 5678"
              />
              {locationErrors.phone && (
                <p className="text-sm text-red-400 mt-1">{locationErrors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Email</label>
              <Input
                type="email"
                {...registerLocation('email')}
                placeholder="branch@example.com"
              />
              {locationErrors.email && (
                <p className="text-sm text-red-400 mt-1">{locationErrors.email.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                {...registerLocation('isActive')}
                className="w-4 h-4 rounded border-white/10 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-white">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBranchDialogOpen(false);
                  resetLocation();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLocation.isPending}
              >
                {createLocation.isPending ? 'Creating...' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
