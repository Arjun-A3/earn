import { X } from 'lucide-react';
import posthog from 'posthog-js';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { tokenList } from '@/constants/tokenList';

interface RejectModalProps {
  rejectIsOpen: boolean;
  rejectOnClose: () => void;
  applicationId: string | undefined;
  ask: number | undefined;
  granteeName: string | null | undefined;
  token: string;
  onRejectGrant: (applicationId: string) => void;
}

export const RejectGrantApplicationModal = ({
  applicationId,
  rejectIsOpen,
  rejectOnClose,
  ask,
  granteeName,
  token,
  onRejectGrant,
}: RejectModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const rejectGrant = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      posthog.capture('reject_grant application');
      await onRejectGrant(applicationId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      rejectOnClose();
    }
  };

  return (
    <Dialog open={rejectIsOpen} onOpenChange={rejectOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-md font-semibold text-slate-500">
            Reject Grant Payment
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="text-[0.95rem] font-medium">
          <p className="mt-3 text-slate-500">
            You are about to reject {granteeName}’s grant request. They will be
            notified via email.
          </p>

          <br />

          <div className="mb-8 flex items-center justify-between">
            <p className="text-slate-500">Grant Request</p>
            <div className="flex items-center">
              <img
                className="h-6 w-6 rounded-full"
                alt={`${token} icon`}
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              />
              <p className="ml-1 font-semibold text-slate-500">
                {ask} <span>{token}</span>
              </p>
            </div>
          </div>

          <Button
            className="mb-3 w-full bg-rose-600 text-white hover:bg-rose-600/90"
            disabled={loading}
            onClick={rejectGrant}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2" />
                <span>Rejecting</span>
              </>
            ) : (
              <>
                <div className="mr-2 rounded-full bg-white p-[5px]">
                  <X className="h-2.5 w-2.5 text-rose-600" />
                </div>
                <span>Reject Grant</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
