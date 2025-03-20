import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.body;

  if (!id || typeof id !== 'string') {
    logger.warn('Invalid request: ID is required and must be a string');
    return res
      .status(400)
      .json({ error: 'ID is required and must be a string' });
  }

  try {
    const result = await prisma.grantApplication.update({
      where: { id, applicationStatus: 'Approved' },
      data: {
        applicationStatus: 'Completed',
      },
      include: {
        user: true,
        grant: true,
      },
    });

    if (!result) {
      logger.warn(`Grant application with ID ${id} not found`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    try {
      sendEmailNotification({
        type: 'grantCompleted',
        id: result.id,
        userId: result.user.id,
        triggeredBy: result.grant.pocId,
      });
    } catch (err) {
      logger.error(
        `Failed to send email for grant completed notification for application ID ${result.id}: ${err}`,
      );
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error updating grant application with ID ${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withSponsorAuth(handler);
