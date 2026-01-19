import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import type { Alert } from '../../api/types';
import { cn } from '../../lib/utils';

interface AlertsWidgetProps {
  alerts: Alert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  if (alerts.length === 0) {
    return null;
  }

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm',
                'transition-all duration-200 hover:scale-[1.01]',
                getBgColor(alert.type)
              )}
            >
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
