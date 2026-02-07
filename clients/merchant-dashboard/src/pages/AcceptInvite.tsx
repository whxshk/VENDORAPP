import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { acceptInvite, getInviteDetails } from '../api/merchant';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useErrorHandlerContext } from '../hooks/useErrorHandler';

function roleLabel(role: string) {
  if (role === 'MERCHANT_ADMIN') return 'Owner';
  if (role === 'MANAGER') return 'Manager';
  if (role === 'CASHIER') return 'Cashier';
  if (role === 'JANITOR') return 'Janitor';
  return 'Staff';
}

export default function AcceptInvitePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const { addError } = useErrorHandlerContext();
  const [name, setName] = useState('');

  const token = useMemo(() => inviteToken || '', [inviteToken]);

  const inviteDetails = useQuery({
    queryKey: ['invite', token],
    queryFn: () => getInviteDetails(token),
    enabled: token.length > 0,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite({ inviteToken: token, name }),
    onSuccess: (result) => {
      const safeName = encodeURIComponent(result?.name || name.trim());
      const safeRole = encodeURIComponent(result?.role || 'STAFF');
      navigate(`/invite/welcome?name=${safeName}&role=${safeRole}`, { replace: true });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.originalMessage ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Unable to accept invite';
      addError(new Error(message), 'Invite Acceptance');
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-[#060d1f] flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invalid Invite Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Invite token is missing from this URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d1f] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Join SharkBand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {inviteDetails.isLoading && <p className="text-slate-300">Loading invite...</p>}
          {inviteDetails.isError && (
            <p className="text-red-400">This invite is invalid or expired.</p>
          )}
          {inviteDetails.data && (
            <>
              <div className="text-sm text-slate-300 space-y-1">
                <p>
                  Merchant: <span className="text-white font-medium">{inviteDetails.data.tenantName}</span>
                </p>
                <p>
                  Role: <span className="text-white font-medium">{roleLabel(inviteDetails.data.role)}</span>
                </p>
                <p>
                  Email: <span className="text-white font-medium">{inviteDetails.data.email}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Your Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <Button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending || name.trim().length === 0}
                className="w-full"
              >
                {acceptMutation.isPending ? 'Completing...' : 'Accept & Continue'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
