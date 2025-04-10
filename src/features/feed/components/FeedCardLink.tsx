import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

export const FeedCardLink = ({
  href,
  style,
  children,
}: {
  href: string | undefined;
  style?: React.HTMLAttributes<HTMLDivElement>['className'];
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        'group-hover:underline-none hidden items-center gap-2 whitespace-nowrap md:flex',
        style,
      )}
    >
      <Link
        href={getURLSanitized(href ?? '#')}
        rel="noopener noreferrer"
        target="_blank"
        className="hover:decoration-brand-purple flex items-center gap-3 hover:underline hover:underline-offset-2"
      >
        <span className="text-brand-purple text-sm font-medium md:text-base">
          {children}
        </span>
        <ArrowRight className="text-brand-purple h-4 w-4" />
      </Link>
    </div>
  );
};
