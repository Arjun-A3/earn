import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { queueAgent } from '@/features/agents/utils/queueAgent';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

export const maxDuration = 300;

// Not sponsor gating this API since this is called at grant application create
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  try {
    logger.debug(`Request body: ${safeStringify(body)}`);

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid ID provided',
          message: `Invalid ID provided for reviewing grant application grant with ${id}.`,
        },
        { status: 400 },
      );
    }

    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    await queueAgent({
      type: 'autoReviewGrantApplication',
      id,
    });
    return NextResponse.json(
      { message: 'Queued Successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error(
      `Error occurred while committing reviewed grant applications`,
      {
        id,
      },
    );
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while committing reviewed grant applications.`,
      },
      { status: 500 },
    );
  }
}
