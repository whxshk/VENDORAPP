import { useState } from 'react';
import { useStaff, useInviteStaff, useCreateStaff, useUpdateStaff } from '../../hooks/useStaff';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { UserCog, Plus, Mail, UserPlus, Pencil } from 'lucide-react';
import { useErrorHandlerContext } from '../../hooks/useErrorHandler';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'manager', 'cashier', 'staff', 'janitor']),
});

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['MERCHANT_ADMIN', 'MANAGER', 'CASHIER', 'STAFF', 'JANITOR']),
  locationId: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;
type CreateStaffFormData = z.infer<typeof createStaffSchema>;
type EditStaffFormData = {
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor';
  password?: string;
};

export default function StaffPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteLink: string; email: string } | null>(null);
  const { addError } = useErrorHandlerContext();

  const { data: staff, isLoading } = useStaff();
  const inviteStaff = useInviteStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'staff',
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

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EditStaffFormData>({
    defaultValues: {
      role: 'staff',
      password: '',
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteStaff.mutate(data, {
      onSuccess: (result: any) => {
        if (result && result.emailSent === false && result.inviteLink) {
          setInviteResult({ inviteLink: result.inviteLink, email: result.email || data.email });
        } else {
          setIsInviteOpen(false);
          setInviteResult(null);
          reset();
        }
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.error?.originalMessage
          || error?.response?.data?.error?.message 
          || error?.response?.data?.message 
          || error?.message 
          || 'Failed to invite staff';
        
        let friendlyMessage: string;
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          friendlyMessage = `A staff member with email ${data.email} already exists. Please use a different email address.`;
        } else if (errorMessage.includes('Email delivery is not configured')) {
          friendlyMessage = 'Invitation was blocked because email delivery is not configured on backend. Add SMTP settings in backend .env first.';
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
        const errorMessage = error?.response?.data?.error?.originalMessage
          || error?.response?.data?.error?.message 
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

  const onSubmitEdit = (data: EditStaffFormData) => {
    if (!editingStaffId) return;

    updateStaff.mutate(
      {
        id: editingStaffId,
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password?.trim() ? data.password : undefined,
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingStaffId(null);
          resetEdit();
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error?.originalMessage
            || error?.response?.data?.error?.message
            || error?.response?.data?.message
            || error?.message
            || 'Failed to update staff member';

          addError(new Error(`Unable to update staff member: ${errorMessage}`), 'Staff Update Error');
        },
      },
    );
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'cashier':
        return 'outline';
      case 'janitor':
        return 'outline';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
          <p className="text-slate-400">Manage your team members and create cashier credentials for scan-only access.</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Staff</h1>
        <p className="text-slate-400">Manage your team members and create cashier credentials for scan-only access.</p>
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
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staff?.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors duration-150">
                      <td className="py-4 px-6 text-sm font-semibold text-white">{member.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-400">{member.email}</td>
                      <td className="py-4 px-6 text-sm text-slate-500">Not viewable (secure)</td>
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
                      <td className="py-4 px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingStaffId(member.id);
                            setIsEditOpen(true);
                            resetEdit({
                              name: member.name,
                              email: member.email,
                              role: member.role,
                              password: '',
                            });
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
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
      <Dialog open={isInviteOpen} onOpenChange={(open) => {
        if (!open) { setInviteResult(null); reset(); }
        setIsInviteOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogClose onClose={() => {
              setIsInviteOpen(false);
              setInviteResult(null);
              reset();
            }} />
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-5 mt-6">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                Email delivery is not configured on the server. Share this invite link manually with <strong>{inviteResult.email}</strong>:
              </div>
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Invite Link</label>
                <div className="flex gap-2">
                  <Input
                    value={inviteResult.inviteLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(inviteResult!.inviteLink)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => { setIsInviteOpen(false); setInviteResult(null); reset(); }}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
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
                  <option value="janitor">Janitor</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                  <option value="staff">Staff</option>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff Credentials</DialogTitle>
            <DialogClose onClose={() => {
              setIsCreateOpen(false);
              resetCreate();
            }} />
          </DialogHeader>
          <p className="text-sm text-slate-400 mt-4">
            Cashier accounts can sign in and only access scanning, point issuance, and reward redemption.
          </p>
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
                <option value="JANITOR">Janitor</option>
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

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogClose onClose={() => {
              setIsEditOpen(false);
              setEditingStaffId(null);
              resetEdit();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Username <span className="text-red-400">*</span>
              </label>
              <Input {...registerEdit('name', { required: 'Name is required' })} placeholder="Staff name" />
              {editErrors.name && <p className="text-sm text-red-400 mt-1">{editErrors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Email <span className="text-red-400">*</span>
              </label>
              <Input type="email" {...registerEdit('email', { required: 'Email is required' })} placeholder="staff@example.com" />
              {editErrors.email && <p className="text-sm text-red-400 mt-1">{editErrors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Role <span className="text-red-400">*</span>
              </label>
              <Select {...registerEdit('role', { required: 'Role is required' })}>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="janitor">Janitor</option>
                <option value="staff">Staff</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                New Password
              </label>
              <Input
                type="password"
                {...registerEdit('password', {
                  validate: (value) => !value || value.length >= 8 || 'Password must be at least 8 characters',
                })}
                placeholder="Leave blank to keep current password"
              />
              {editErrors.password && <p className="text-sm text-red-400 mt-1">{editErrors.password.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingStaffId(null);
                  resetEdit();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateStaff.isPending}>
                <Pencil className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
