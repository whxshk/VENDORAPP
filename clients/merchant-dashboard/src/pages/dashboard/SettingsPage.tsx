import React, { useState, useEffect } from 'react';
import { useMerchantSettings, useUpdateMerchantSettings, useCreateLocation, useUpdateLocation, useDeleteLocation } from '../../hooks/useMerchant';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { useErrorHandlerContext } from '../../hooks/useErrorHandler';
import { Building2, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';
import type { Branch } from '../../api/types';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type LocationFormData = z.infer<typeof locationSchema>;

const MERCHANT_CATEGORIES = [
  { value: '', label: 'Select a category…' },
  { value: 'cafe', label: 'Café' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retail', label: 'Retail' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'other', label: 'Other' },
];

type MerchantFormData = {
  name: string;
  description: string;
  category: string;
};

export default function SettingsPage() {
  const { data: merchant, isLoading } = useMerchantSettings();
  const updateMerchant = useUpdateMerchantSettings();
  const createLocation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();
  const { addError } = useErrorHandlerContext();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantFormData>({
    defaultValues: {
      name: merchant?.name || '',
      description: merchant?.description || '',
      category: merchant?.category || '',
    },
    values: merchant ? {
      name: merchant.name,
      description: merchant.description || '',
      category: merchant.category || '',
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

  const {
    register: registerEditLocation,
    handleSubmit: handleSubmitEditLocation,
    formState: { errors: editLocationErrors },
    reset: resetEditLocation,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  // Update edit form when editingBranch changes
  useEffect(() => {
    if (editingBranch) {
      resetEditLocation({
        name: editingBranch.name,
        address: editingBranch.address || '',
        isActive: editingBranch.isActive,
      });
    }
  }, [editingBranch, resetEditLocation]);

  const onSubmit = (data: MerchantFormData) => {
    updateMerchant.mutate({ ...data, category: data.category || undefined }, {
      onSuccess: () => {
        // Show success message
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message 
          || error?.response?.data?.message 
          || error?.message 
          || 'Failed to update settings';
        
        let friendlyMessage: string;
        if (errorMessage.includes('validation') || errorMessage.includes('required')) {
          friendlyMessage = 'Please check all fields are filled correctly.';
        } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          friendlyMessage = 'You do not have permission to update settings. Please contact your administrator.';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          friendlyMessage = `Unable to save settings: ${errorMessage}`;
        }
        
        addError(new Error(friendlyMessage), 'Settings Update Error');
      },
    });
  };

  const onSubmitLocation = (data: LocationFormData) => {
    createLocation.mutate(data, {
      onSuccess: () => {
        setIsBranchDialogOpen(false);
        resetLocation();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message 
          || error?.response?.data?.message 
          || error?.message 
          || 'Failed to create branch';
        
        let friendlyMessage: string;
        if (errorMessage.includes('validation') || errorMessage.includes('required')) {
          friendlyMessage = 'Please fill in all required fields (Name and Address are required).';
        } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
          friendlyMessage = `A branch named "${data.name}" already exists. Please use a different name.`;
        } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          friendlyMessage = 'You do not have permission to create branches. Please contact your administrator.';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          friendlyMessage = `Unable to create branch: ${errorMessage}`;
        }
        
        addError(new Error(friendlyMessage), 'Branch Creation Error');
      },
    });
  };

  const onSubmitEditLocation = (data: LocationFormData) => {
    if (!editingBranch) return;
    
    updateLocationMutation.mutate(
      { id: editingBranch.id, params: data },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingBranch(null);
          resetEditLocation();
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error?.message 
            || error?.response?.data?.message 
            || error?.message 
            || 'Failed to update branch';
          
          let friendlyMessage: string;
          if (errorMessage.includes('validation') || errorMessage.includes('required')) {
            friendlyMessage = 'Please fill in all required fields.';
          } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
            friendlyMessage = 'You do not have permission to update branches. Please contact your administrator.';
          } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
          } else {
            friendlyMessage = `Unable to update branch: ${errorMessage}`;
          }
          
          addError(new Error(friendlyMessage), 'Branch Update Error');
        },
      }
    );
  };

  const confirmDeleteBranch = () => {
    if (!branchToDelete) return;
    deleteLocationMutation.mutate(branchToDelete.id, {
      onSuccess: () => {
        setBranchToDelete(null);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message
          || error?.response?.data?.message
          || error?.message
          || 'Failed to delete branch';

        addError(new Error(`Unable to delete branch: ${errorMessage}`), 'Branch Delete Error');
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
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
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
                  <label className="text-sm font-semibold text-white mb-2 block">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 rounded-lg text-sm border bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {MERCHANT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Shown to customers in the Discover and Wallet screens.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Logo</label>
                  <div className="flex items-center gap-4">
                    {merchant?.logoUrl ? (
                      <img
                        src={merchant.logoUrl}
                        alt="Business logo"
                        className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-7 w-7 text-slate-500" />
                      </div>
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/20 bg-white/5 text-slate-400 text-sm cursor-pointer hover:border-blue-400/50 hover:bg-blue-500/5 hover:text-slate-300 transition-all">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {merchant?.logoUrl ? 'Change logo' : 'Upload logo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            updateMerchant.mutate({ logoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }}
                        disabled={updateMerchant.isPending}
                      />
                    </label>
                  </div>
                </div>

                <Button type="submit" disabled={updateMerchant.isPending}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Choose how the dashboard looks. Your preference is saved automatically.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      { value: 'light', label: 'Light', Icon: Sun, desc: 'Classic light background' },
                      { value: 'dark', label: 'Dark', Icon: Moon, desc: 'Easy on the eyes' },
                      { value: 'system', label: 'System Default', Icon: Monitor, desc: 'Follows your OS setting' },
                    ] as { value: Theme; label: string; Icon: React.ElementType; desc: string }[]
                  ).map(({ value, label, Icon, desc }) => {
                    const isSelected = theme === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-blue-500/60 bg-blue-500/10'
                            : 'hover:border-white/20 hover:bg-white/5'
                        }`}
                        style={!isSelected ? { borderColor: 'var(--border)' } : undefined}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-400' : ''}`}
                          style={!isSelected ? { color: 'var(--text-muted)' } : undefined}
                        />
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? 'text-blue-300' : ''}`}
                            style={!isSelected ? { color: 'var(--text-primary)' } : undefined}
                          >
                            {label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                        </div>
                        {isSelected && (
                          <div className="mt-auto w-full h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Building2 className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm font-medium">Coming soon</p>
              </div>
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

      <ConfirmDialog
        open={!!branchToDelete}
        title="Delete Branch"
        description={
          branchToDelete
            ? `Delete branch "${branchToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Branch"
        cancelLabel="Keep Branch"
        tone="danger"
        isLoading={deleteLocationMutation.isPending}
        onCancel={() => setBranchToDelete(null)}
        onConfirm={confirmDeleteBranch}
      />

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingBranch(null);
          resetEditLocation();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogClose onClose={() => {
              setIsEditDialogOpen(false);
              setEditingBranch(null);
              resetEditLocation();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmitEditLocation(onSubmitEditLocation)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                {...registerEditLocation('name')}
                placeholder="Main Branch"
              />
              {editLocationErrors.name && (
                <p className="text-sm text-red-400 mt-1">{editLocationErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Address
              </label>
              <Input
                {...registerEditLocation('address')}
                placeholder="123 Main Street"
              />
              {editLocationErrors.address && (
                <p className="text-sm text-red-400 mt-1">{editLocationErrors.address.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">City</label>
              <Input
                {...registerEditLocation('city')}
                placeholder="Doha"
              />
              {editLocationErrors.city && (
                <p className="text-sm text-red-400 mt-1">{editLocationErrors.city.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Phone</label>
              <Input
                {...registerEditLocation('phone')}
                placeholder="+974 1234 5678"
              />
              {editLocationErrors.phone && (
                <p className="text-sm text-red-400 mt-1">{editLocationErrors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Email</label>
              <Input
                type="email"
                {...registerEditLocation('email')}
                placeholder="branch@example.com"
              />
              {editLocationErrors.email && (
                <p className="text-sm text-red-400 mt-1">{editLocationErrors.email.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="editIsActive"
                {...registerEditLocation('isActive')}
                className="w-4 h-4 rounded border-white/10 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="editIsActive" className="text-sm font-semibold text-white">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingBranch(null);
                  resetEditLocation();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateLocationMutation.isPending}
              >
                {updateLocationMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
