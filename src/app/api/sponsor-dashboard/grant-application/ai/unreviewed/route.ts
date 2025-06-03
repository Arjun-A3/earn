import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { type GrantApplicationAi } from '@/features/grants/types';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      {
        error: 'Invalid ID provided',
        message: `Invalid ID provided for retrieving unreviewed grant application grant for grant with ${id}.`,
      },
      { status: 400 },
    );
  }
  try {
    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }
    const { error } = await checkGrantSponsorAuth(
      session.data.userSponsorId,
      id,
    );
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const unreviewedApplications = await prisma.grantApplication.findMany({
      where: {
        grantId: id,
        applicationStatus: 'Pending',
        label: {
          in: ['Unreviewed', 'Pending'],
        },
      },
      select: {
        id: true,
        label: true,
        ai: true,
        applicationStatus: true,
      },
    });
    const hasAiReview = unreviewedApplications.filter(
      (u) => !!(u.ai as unknown as GrantApplicationAi)?.review?.predictedLabel,
    );
    const notReviewedByAI = hasAiReview.filter(
      (u) => !(u.ai as unknown as GrantApplicationAi)?.commited,
    );
    return NextResponse.json(notReviewedByAI, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while retrieving unreviewed grant applications`,
      {
        id,
      },
    );
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while retrieving unreviewed grant applications`,
      },
      { status: 500 },
    );
  }
}
