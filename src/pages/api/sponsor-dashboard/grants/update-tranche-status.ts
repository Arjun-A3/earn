import { GrantTrancheStatus } from '@prisma/client';
import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { addPaymentInfoToAirtable } from '@/features/grants/utils/addPaymentInfoToAirtable';

const UpdateGrantTrancheSchema = z.object({
  id: z.string(),
  approvedAmount: z.union([z.number().int().min(0), z.null()]).optional(),
  status: z.enum(['Approved', 'Rejected']),
});

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const validationResult = UpdateGrantTrancheSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    logger.warn('Invalid request body:', errorMessage);
    return res.status(400).json({
      error: 'Invalid request body',
      details: errorMessage,
    });
  }

  const { id, status, approvedAmount } = validationResult.data;
  const userId = req.userId;

  try {
    const currentTranche = await prisma.grantTranche.findUniqueOrThrow({
      where: { id },
    });

    const { error } = await checkGrantSponsorAuth(
      req.userSponsorId,
      currentTranche.grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const updateData: any = {
      status,
      decidedAt: new Date().toISOString(),
      approvedAmount,
    };

    const application = await prisma.grantApplication.findUniqueOrThrow({
      where: { id: currentTranche.applicationId },
      select: {
        totalTranches: true,
        approvedAmount: true,
        totalPaid: true,
      },
    });

    let totalTranches = application.totalTranches;

    if (status === 'Approved') {
      const approvedTranches = await prisma.grantTranche.findMany({
        where: {
          applicationId: currentTranche.applicationId,
          status: 'Approved',
          id: { not: id },
        },
        select: {
          approvedAmount: true,
        },
      });

      const totalApprovedSoFar = approvedTranches.reduce(
        (sum, tranche) => sum + (tranche.approvedAmount || 0),
        0,
      );

      if (totalApprovedSoFar + approvedAmount! > application.approvedAmount) {
        return res.status(400).json({
          error: 'Invalid approved amount',
          message: `Total approved tranches (${totalApprovedSoFar + approvedAmount!}) would exceed grant's approved amount (${application.approvedAmount})`,
        });
      }

      const existingTranches = await prisma.grantTranche.count({
        where: {
          applicationId: currentTranche.applicationId,
          status: {
            not: 'Rejected',
          },
        },
      });
      if (
        totalTranches - existingTranches === 0 &&
        application.totalPaid + approvedAmount! < application.approvedAmount
      ) {
        totalTranches! += 1;
      }
      await prisma.grantApplication.update({
        where: { id: currentTranche.applicationId },
        include: {
          grant: true,
          user: true,
        },
        data: { totalTranches },
      });
    }

    const result = await prisma.grantTranche.update({
      where: { id },
      data: updateData,
      include: {
        GrantApplication: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                twitter: true,
                discord: true,
                kycName: true,
                location: true,
              },
            },
            grant: {
              select: {
                airtableId: true,
                isNative: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (result.status === GrantTrancheStatus.Approved) {
      try {
        await addPaymentInfoToAirtable(result.GrantApplication, result);
      } catch (airtableError: any) {
        console.error(
          `Error adding payment info to Airtable: ${airtableError.message}`,
        );
        console.error(
          `Airtable error details: ${safeStringify(airtableError.response?.data || airtableError)}`,
        );
      }
      try {
        sendEmailNotification({
          type: 'trancheApproved',
          id: result.id,
          triggeredBy: userId,
        });
      } catch (emailError: any) {
        logger.error(
          `Failed to send tranche approved email notification for tranche ID: ${result.id}`,
          {
            error: emailError.message,
            stack: emailError.stack,
            trancheId: result.id,
            userId,
            recipientEmail: result.GrantApplication.user.email,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
          },
        );
      }
    }

    if (result.status === GrantTrancheStatus.Rejected) {
      try {
        sendEmailNotification({
          type: 'trancheRejected',
          id: result.id,
          triggeredBy: userId,
        });
      } catch (emailError: any) {
        logger.error(
          `Failed to send tranche rejected email notification for tranche ID: ${result.id}`,
          {
            error: emailError.message,
            stack: emailError.stack,
            trancheId: result.id,
            userId,
            recipientEmail: result.GrantApplication.user.email,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
          },
        );
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating grant tranche ID: ${id}:  ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant tranche.',
    });
  }
}

export default withSponsorAuth(handler);
