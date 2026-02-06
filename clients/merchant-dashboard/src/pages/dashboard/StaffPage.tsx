import { useState } from 'react';
import { useStaff, useInviteStaff, useCreateStaff } from '../../hooks/useStaff';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { UserCog, Plus, Mail, UserPlus } from 'lucide-react';
import { useErrorHandlerContext } from '../../hooks/useErrorHandler';
import { formatDate } from '../../lib/utils';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'manager', 'cashier']),
});

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MERCHANT_ADMIN', 'MANAGER', 'CASHIER', 'STAFF']),
  locationId: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;
type CreateStaffFormData = z.infer<typeof createStaffSchema>;

export default function StaffPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { addError } = useErrorHandlerContext();

  const { data: staff, isLoading } = useStaff();
  const inviteStaff = useInviteStaff();
  const createStaff = useCreateStaff();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'cashier',
    },
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
  } = useForm<CreateStaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      role: 'CASHIER',
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteStaff.mutate(data, {
      onSuccess: () => {
        setIsInviteOpen(false);
        reset();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message 
          || error?.response?.data?.message 
          || error?.message 
          || 'Failed to invite staff';
        
        let friendlyMessage: string;
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          friendlyMessage = `A staff member with email ${data.email} already exists. Please use a different email address.`;
        } else if (errorMessage.includes('invalid email') || errorMessage.includes('validation')) {
          friendlyMessage = 'Please enter a valid email address (e.g., staff@example.com).';
        } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          friendlyMessage = 'You do not have permission to invite staff members. Please contact your administrator.';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          friendlyMessage = `Unable to send invitation: ${errorMessage}`;
        }
        
        addError(new Error(friendlyMessage), 'Staff Invitation Error');
      },
    });
  };

  const onSubmitCreate = (data: CreateStaffFormData) => {
    createStaff.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        resetCreate();
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.message 
          || error?.response?.data?.message 
          || error?.message 
          || 'Failed to create staff';
        
        let friendlyMessage: string;
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          friendlyMessage = `A staff member with email ${data.email} already exists. Please use a different email address.`;
        } else if (errorMessage.includes('invalid email') || errorMessage.includes('validation')) {
          friendlyMessage = 'Please check all fields are filled correctly. Email must be valid and password must be at least 8 characters.';
        } else if (errorMessage.includes('password') && errorMessage.includes('weak')) {
          friendlyMessage = 'Password is too weak. Please use a stronger password with at least 8 characters.';
        } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          friendlyMessage = 'You do not have permission to create staff members. Please contact your administrator.';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          friendlyMessage = `Unable to create staff member: ${errorMessage}`;
        }
        
        addError(new Error(friendlyMessage), 'Staff Creation Error');
      },
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
          <p className="text-slate-400">Manage your team members</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
          <p className="text-slate-400">Manage your team members</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
          <Button onClick={() => setIsInviteOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {staff?.length === 0 ? (
            <div className="text-center py-16">
              <UserCog className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400 mb-6 text-lg">No staff members yet</p>
              <Button onClick={() => setIsInviteOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Invite Your First Staff Member
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staff?.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors duration-150">
                      <td className="py-4 px-6 text-sm font-semibold text-white">{member.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-400">{member.email}</td>
                      <td className="py-4 px-6">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={member.status === 'active' ? 'success' : member.status === 'invited' ? 'warning' : 'secondary'}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {member.lastActive ? formatDate(member.lastActive) : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogClose onClose={() => {
              setIsInviteOpen(false);
              reset();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Email</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="staff@example.com"
              />
              {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Role</label>
              <Select {...register('role')}>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </Select>
              {errors.role && <p className="text-sm text-red-400 mt-1">{errors.role.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInviteOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteStaff.isPending}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff Member</DialogTitle>
            <DialogClose onClose={() => {
              setIsCreateOpen(false);
              resetCreate();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                {...registerCreate('name')}
                placeholder="John Doe"
              />
              {createErrors.name && <p className="text-sm text-red-400 mt-1">{createErrors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Email <span className="text-red-400">*</span>
              </label>
              <Input
                type="email"
                {...registerCreate('email')}
                placeholder="staff@example.com"
              />
              {createErrors.email && <p className="text-sm text-red-400 mt-1">{createErrors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Password <span className="text-red-400">*</span>
              </label>
              <Input
                type="password"
                {...registerCreate('password')}
                placeholder="Minimum 8 characters"
              />
              {createErrors.password && <p className="text-sm text-red-400 mt-1">{createErrors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Role <span className="text-red-400">*</span>
              </label>
              <Select {...registerCreate('role')}>
                <option value="MERCHANT_ADMIN">Merchant Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier</option>
                <option value="STAFF">Staff</option>
              </Select>
              {createErrors.role && <p className="text-sm text-red-400 mt-1">{createErrors.role.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetCreate();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createStaff.isPending}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Staff
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
