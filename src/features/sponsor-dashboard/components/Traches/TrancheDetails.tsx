import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { type Grant } from '@/features/grants/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantTrancheAtom } from '../../atoms';
import { type GrantTrancheWithApplication } from '../../queries/tranches';
import { InfoBox } from '../InfoBox';

interface Props {
  grant: Grant | undefined;
  tranches: GrantTrancheWithApplication[] | undefined;
  approveOnOpen: () => void;
  rejectedOnOpen: () => void;
}
export const TrancheDetails = ({
  grant,
  tranches,
  approveOnOpen,
  rejectedOnOpen,
}: Props) => {
  const selectedTranche = useAtomValue(selectedGrantTrancheAtom);
  const isPending = selectedTranche?.status === 'Pending';
  const isApproved = selectedTranche?.status === 'Approved';
  const isRejected = selectedTranche?.status === 'Rejected';

  const tokenIcon = tokenList.find(
    (ele) => ele.tokenSymbol === grant?.token,
  )?.icon;

  const formattedCreatedAt = dayjs(selectedTranche?.createdAt).format(
    'DD MMM YYYY',
  );

  const formattedDecidedAt = dayjs(
    selectedTranche?.GrantApplication?.decidedAt,
  ).format('DD MMM YYYY');

  const { onCopy: onCopyEmail } = useClipboard(
    selectedTranche?.GrantApplication?.user?.email || '',
  );

  const { onCopy: onCopyPublicKey } = useClipboard(
    selectedTranche?.GrantApplication?.walletAddress || '',
  );

  const handleCopyEmail = () => {
    if (selectedTranche?.GrantApplication?.user?.email) {
      onCopyEmail();
      toast.success('Email copied to clipboard', {
        duration: 1500,
      });
    }
  };

  const handleCopyPublicKey = () => {
    if (selectedTranche?.GrantApplication?.walletAddress) {
      onCopyPublicKey();
      toast.success('Wallet address copied to clipboard', {
        duration: 1500,
      });
    }
  };

  const totalPaid = selectedTranche?.GrantApplication?.totalPaid || 0;
  const approvedAmount = selectedTranche?.GrantApplication?.approvedAmount || 0;

  const paidPercentage = (totalPaid / approvedAmount) * 100;

  return (
    <div className="w-full rounded-r-xl bg-white">
      {tranches?.length ? (
        <>
          <div className="sticky top-[3rem] rounded-t-xl border-b border-slate-200 bg-white py-1">
            <div className="flex w-full items-center justify-between px-4 py-2">
              <div className="flex w-full items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={selectedTranche?.GrantApplication?.user?.id}
                  avatar={
                    selectedTranche?.GrantApplication?.user?.photo || undefined
                  }
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="w-full text-base font-medium whitespace-nowrap text-slate-900">
                      {`${selectedTranche?.GrantApplication?.user?.firstName}`}
                      ’s Application
                    </p>
                    <p className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-green-600">
                      <VerifiedBadge className="text-green-600" />
                      KYC
                    </p>
                  </div>

                  <Link
                    href={`/t/${selectedTranche?.GrantApplication?.user?.username}`}
                    className="text-brand-purple flex w-full items-center gap-1 text-xs font-medium whitespace-nowrap"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View Profile
                    <ArrowRight className="mb-0.5 h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="ph-no-capture flex w-full items-center justify-end gap-2">
                {isPending && (
                  <>
                    <Button
                      className={cn(
                        'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600',
                      )}
                      onClick={approveOnOpen}
                      variant="ghost"
                    >
                      <div className="mr-2 flex items-center">
                        <div className="rounded-full bg-emerald-600 p-[5px]">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      Approve
                    </Button>

                    <Button
                      className={cn(
                        'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-600',
                      )}
                      onClick={rejectedOnOpen}
                      variant="ghost"
                    >
                      <div className="mr-2 flex items-center">
                        <div className="rounded-full bg-rose-600 p-[5px]">
                          <X className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      Reject
                    </Button>
                  </>
                )}
                {isApproved && (
                  <>
                    <Button
                      className="pointer-events-none bg-emerald-50 text-emerald-600 disabled:opacity-100"
                      disabled={true}
                      variant="ghost"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-emerald-600 p-[5px]">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      Approved
                    </Button>
                  </>
                )}
                {isRejected && (
                  <>
                    <Button
                      className="pointer-events-none bg-rose-50 text-rose-600 disabled:opacity-100"
                      disabled={true}
                      variant="ghost"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-rose-600 p-[5px]">
                          <X className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      Rejected
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2">
              <div className="flex items-center">
                <p className="mr-3 text-sm font-semibold whitespace-nowrap text-slate-400">
                  TOTAL GRANT
                </p>
                <img
                  className="mr-0.5 h-4 w-4 rounded-full"
                  src={tokenIcon}
                  alt="token"
                />
                <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                  {`${selectedTranche?.GrantApplication?.approvedAmount?.toLocaleString('en-us')}`}
                  <span className="ml-0.5 text-slate-400">{grant?.token}</span>
                </p>

                <div className="mx-3 flex">
                  <CircularProgress
                    className="h-5 w-5 rounded-full bg-gray-200"
                    value={paidPercentage}
                  />
                  <p className="ml-1 text-sm font-medium whitespace-nowrap text-slate-600">
                    {paidPercentage.toFixed(0)}%{' '}
                    <span className="text-slate-400">Paid</span>
                  </p>
                </div>
              </div>
              {selectedTranche?.GrantApplication?.user?.email && (
                <Tooltip
                  content={'Click to copy'}
                  contentProps={{ side: 'right' }}
                  triggerClassName="flex items-center hover:underline underline-offset-1"
                >
                  <div
                    className="flex cursor-pointer items-center justify-start gap-1 text-sm text-slate-400 hover:text-slate-500"
                    onClick={handleCopyEmail}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy email: ${selectedTranche?.GrantApplication?.user?.email}`}
                  >
                    <MdOutlineMail />
                    {truncateString(
                      selectedTranche?.GrantApplication?.user?.email,
                      36,
                    )}
                  </div>
                </Tooltip>
              )}
              {selectedTranche?.GrantApplication?.walletAddress && (
                <Tooltip
                  content={'Click to copy'}
                  contentProps={{ side: 'right' }}
                  triggerClassName="flex items-center hover:underline underline-offset-1"
                >
                  <div
                    className="flex cursor-pointer items-center justify-start gap-1 text-sm whitespace-nowrap text-slate-400 hover:text-slate-500"
                    onClick={handleCopyPublicKey}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy public key: ${truncatePublicKey(
                      selectedTranche?.GrantApplication?.walletAddress || '',
                      3,
                    )}`}
                  >
                    <MdOutlineAccountBalanceWallet />
                    <p>
                      {truncatePublicKey(
                        selectedTranche?.GrantApplication?.walletAddress || '',
                        3,
                      )}
                    </p>
                  </div>
                </Tooltip>
              )}

              <div className="flex gap-2">
                <Telegram
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedTranche?.GrantApplication?.user?.telegram || ''}
                />
                <Twitter
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedTranche?.GrantApplication?.user?.twitter || ''}
                />
                <Website
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedTranche?.GrantApplication?.user?.website || ''}
                />
              </div>
              <p className="text-sm whitespace-nowrap text-slate-400">
                ${formatNumberWithSuffix(selectedTranche?.totalEarnings || 0)}{' '}
                Earned
              </p>
            </div>
          </div>

          <div className="flex h-[32.6rem] w-full">
            <div className="scrollbar-thumb-rounded-full scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 flex w-full flex-1 flex-col overflow-y-auto border-r border-slate-200 p-4">
              {selectedTranche?.trancheNumber === 1 && (
                <div className="mb-4">
                  <p className="mb-1 text-xs text-slate-500">
                    Note: Since this is the first tranche, it was added here
                    automatically upon user&apos;s successful KYC. First
                    tranches do not require explicit approval from the leads.
                  </p>
                </div>
              )}

              {(selectedTranche?.status === 'Approved' ||
                selectedTranche?.status === 'Paid') && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                    APPROVED TRANCHE AMOUNT
                  </p>
                  <div className="flex items-center gap-0.5">
                    <img
                      className="mr-0.5 h-4 w-4 rounded-full"
                      src={tokenIcon}
                      alt="token"
                    />
                    <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                      {`${selectedTranche?.approvedAmount?.toLocaleString('en-us')}`}
                      <span className="ml-0.5 text-slate-400">
                        {grant?.token}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              {selectedTranche?.trancheNumber !== 1 && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                    TRANCHE ASK
                  </p>
                  <div className="flex items-center gap-0.5">
                    <img
                      className="mr-0.5 h-4 w-4 rounded-full"
                      src={tokenIcon}
                      alt="token"
                    />
                    <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                      {`${selectedTranche?.ask?.toLocaleString('en-us')}`}
                      <span className="ml-0.5 text-slate-400">
                        {grant?.token}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <InfoBox
                label="Tranche Request Date"
                content={formattedCreatedAt}
              />
              <InfoBox
                label="KPIS AND MILESTONES"
                content={selectedTranche?.GrantApplication?.kpi}
                isHtml
              />
              <InfoBox
                label="Project Updates"
                content={selectedTranche?.update}
                isHtml
              />
              <InfoBox
                label="Help Wanted"
                content={selectedTranche?.helpWanted}
                isHtml
              />
              <InfoBox
                label="Grant Approval Date"
                content={formattedDecidedAt}
              />
              <InfoBox
                label="Twitter"
                content={selectedTranche?.GrantApplication?.twitter}
              />

              {Array.isArray(selectedTranche?.GrantApplication?.answers) &&
                selectedTranche?.GrantApplication?.answers.map(
                  (answer: any, answerIndex: number) => (
                    <InfoBox
                      key={answerIndex}
                      label={answer.question}
                      content={answer.answer}
                      isHtml
                    />
                  ),
                )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-3">
          <p className="text-xl font-medium text-slate-500">
            No applications found
          </p>
          <p className="text-sm text-slate-400">Try a different search query</p>
        </div>
      )}
    </div>
  );
};
