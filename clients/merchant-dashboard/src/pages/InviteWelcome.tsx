import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

function roleLabel(role?: string) {
  if (role === 'MERCHANT_ADMIN') return 'Owner';
  if (role === 'MANAGER') return 'Manager';
  if (role === 'CASHIER') return 'Cashier';
  if (role === 'JANITOR') return 'Janitor';
  if (role === 'STAFF') return 'Staff';
  return 'Team Member';
}

export default function InviteWelcomePage() {
  const [searchParams] = useSearchParams();

  const name = useMemo(() => searchParams.get('name') || 'there', [searchParams]);
  const role = useMemo(() => searchParams.get('role') || 'STAFF', [searchParams]);

  return (
    <div className="min-h-screen bg-[#060d1f] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Welcome to SharkBand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-slate-200">
            Hi <span className="text-white font-semibold">{name}</span>, your invitation has been accepted.
          </p>
          <p className="text-slate-300">
            Your account was created with role: <span className="text-white font-medium">{roleLabel(role)}</span>.
          </p>
          <p className="text-slate-400 text-sm">
            You can now continue to the login page.
          </p>

          <div className="pt-2">
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
