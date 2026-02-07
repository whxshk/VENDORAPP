import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md border-white/15">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${
                tone === 'danger'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{description}</p>
        </DialogHeader>

        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
