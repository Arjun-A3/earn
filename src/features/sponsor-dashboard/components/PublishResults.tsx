import { useAtomValue } from 'jotai';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';

import { type Listing } from '../../listings/types';
import { selectedSubmissionAtom } from '../atoms';
import { useToggleWinner } from '../mutations/useToggleWinner';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  totalWinners: number;
  totalPaymentsMade: number;
  bounty: Listing | undefined;
  remainings: { podiums: number; bonus: number } | null;
  submissions: Array<{ id: string; label?: string }>;
}

export function PublishResults({
  isOpen,
  onClose,
  totalWinners,
  totalPaymentsMade,
  bounty,
  remainings,
  submissions = [],
}: Props) {
  const [isPublishingResults, setIsPublishingResults] = useState(false);
  const [isWinnersAnnounced, setIsWinnersAnnounced] = useState(
    bounty?.isWinnersAnnounced,
  );
  const posthog = usePostHog();
  const isDeadlinePassed = dayjs().isAfter(bounty?.deadline);
  const isProject = bounty?.type === 'project';
  if (isProject) totalWinners = 1;
  // Overrdiding totalWinners if project coz position select is done here now for project only

  const rewards =
    cleanRewards(bounty?.rewards, true).length +
    (bounty?.rewards?.[BONUS_REWARD_POSITION] ? bounty?.maxBonusSpots || 0 : 0);
  let isWinnersAllSelected = !(
    remainings && remainings.podiums + remainings.bonus !== 0
  );
  if (isProject) isWinnersAllSelected = true;
  // Overrdiding isWinnersAllSelected if project coz position select is done here now for project only

  let alertType:
    | 'loading'
    | 'info'
    | 'error'
    | 'warning'
    | 'success'
    | undefined = 'warning';
  let alertTitle = '';
  let alertDescription = '';
  if (!isWinnersAllSelected) {
    const remainingWinners = (rewards || 0) - totalWinners;
    alertType = 'error';
    alertTitle = 'Select All Winners!';
    alertDescription = `You still have to select ${remainingWinners} more ${
      remainingWinners === 1 ? 'winner' : 'winners'
    } before you can publish the results publicly.`;
  } else if (rewards && totalPaymentsMade !== rewards) {
    const remainingPayments = (rewards || 0) - totalPaymentsMade;
    alertType = 'warning';
    alertTitle = 'Pay All Winners!';
    alertDescription = `Don't forget to pay your winners after publishing results. You have to pay to ${remainingPayments} ${
      remainingPayments === 1 ? 'winner' : 'winners'
    }.`;
  }

  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const { mutateAsync: toggleWinner } = useToggleWinner(bounty);

  const publishResults = async () => {
    if (!bounty?.id) return;
    setIsPublishingResults(true);
    try {
      if (isProject) {
        if (selectedSubmission?.id) {
          await toggleWinner([
            {
              winnerPosition: 1,
              id: selectedSubmission?.id,
              isWinner: true,
            },
          ]);
        }
      }
      await api.post(`/api/listings/announce/${bounty?.id}/`);
      setIsWinnersAnnounced(true);
      setIsPublishingResults(false);
    } catch (e) {
      if (isProject) {
        if (selectedSubmission?.id) {
          await toggleWinner([
            {
              winnerPosition: null,
              id: selectedSubmission?.id,
              isWinner: false,
            },
          ]);
        }
      }
      setIsPublishingResults(false);
    }
  };

  useEffect(() => {
    if (!isWinnersAnnounced || bounty?.isWinnersAnnounced) return;
    const timer = setTimeout(() => {
      window.location.reload();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isWinnersAnnounced]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        if (isPublishingResults) return;
        if (isWinnersAnnounced) return;
        onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isWinnersAnnounced && (
            <Alert className="flex-col items-center justify-center py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="mb-1 h-6 w-6" />
                <AlertTitle className="mb-1 text-lg">
                  Results Announced Successfully!
                </AlertTitle>
              </div>
              <AlertDescription className="mx-auto mt-2 max-w-sm">
                The results have been announced publicly. Everyone can view the
                results on the Bounty&apos;s page.
                <br />
                <br />
                {!bounty?.isWinnersAnnounced && (
                  <span className="text-sm text-slate-500">Refreshing...</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            alertType !== 'error' && (
              <p className="mt-1 mb-4">
                Publishing the results of this listing will make the results
                public for everyone to see!
                <br />
                YOU CAN&apos;T GO BACK ONCE YOU PUBLISH THE RESULTS!
              </p>
            )}

          {!isWinnersAnnounced && alertTitle && alertDescription && (
            <Alert
              variant={alertType === 'error' ? 'destructive' : 'default'}
              className="border-brand-purple flex"
            >
              <div className="flex gap-2">
                <AlertTriangle className="-mt-0.5 h-8 w-8" />
                <div>
                  <AlertTitle className="text-base">{alertTitle}</AlertTitle>
                  <AlertDescription>{alertDescription}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {!isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            !isDeadlinePassed && (
              <Alert className="mt-4" variant="destructive">
                <div className="flex gap-2">
                  <AlertTriangle className="-mt-0.5 h-8 w-8" />
                  <div>
                    <AlertTitle className="text-base">
                      Listing still in progress!
                    </AlertTitle>
                    <AlertDescription>
                      If you publish the results before the deadline, the
                      listing will close since the winner(s) will have been
                      announced.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

          {!isWinnersAnnounced &&
            submissions.some((submission) => submission.label === 'Spam') && (
              <Alert className="border-brand-purple mt-4">
                <div className="flex gap-2">
                  <AlertTriangle className="-mt-0.5 h-8 w-8" />
                  <div>
                    <AlertTitle className="text-base">
                      {
                        submissions.filter(
                          (submission) => submission.label === 'Spam',
                        ).length
                      }{' '}
                      Submission(s) Marked as Spam
                    </AlertTitle>
                    <AlertDescription>
                      Marking a submission as &quot;Spam&quot; would penalise
                      the applicant(s) with a deduction in submission credits.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
        </div>

        <DialogFooter>
          {!isWinnersAnnounced && (
            <div className="flex gap-4">
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
              <Button
                className="ph-no-capture"
                disabled={!isWinnersAllSelected || alertType === 'error'}
                onClick={() => {
                  posthog.capture('announce winners_sponsor');
                  publishResults();
                }}
              >
                {isPublishingResults ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="loading loading-spinner" />
                    <span>Publishing...</span>
                  </span>
                ) : (
                  <span>Publish</span>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
