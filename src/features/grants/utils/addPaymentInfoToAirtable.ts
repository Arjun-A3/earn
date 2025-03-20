import { type GrantApplication, type GrantTranche } from '@prisma/client';
import axios from 'axios';

import { Superteams } from '@/constants/Superteam';
import {
  airtableConfig,
  airtableInsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
  };
  user: {
    email: string;
    location: string | null;
    kycName: string | null;
  };
}

interface PaymentAirtableSchema {
  Name: string;
  Amount: number;
  'Wallet Address': string;
  Category: string[];
  'Purpose of Payment': string;
  Status: string;
  Region?: string[];
  earnApplicationId: string;
  earnTrancheId: string;
}

export function grantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
  grantRegionId: string,
  grantTranche: GrantTranche,
): PaymentAirtableSchema {
  return {
    Name: grantApplication.user.kycName || '',
    Amount: grantTranche.approvedAmount || 0,
    'Wallet Address': grantApplication.walletAddress || '',
    Category: ['recd0Kn3N4Ffhtwhd'], // Solana Grant
    'Purpose of Payment': grantApplication.projectTitle || '',
    Status: 'Verified',
    ...(grantRegionId
      ? {
          Region: [grantRegionId],
        }
      : {}),
    earnApplicationId: grantApplication.id,
    earnTrancheId: grantTranche.id,
  };
}

export async function addPaymentInfoToAirtable(
  application: GrantApplicationWithUserAndGrant,
  grantTranche: GrantTranche,
) {
  try {
    const grantsAirtableConfig = airtableConfig(
      process.env.AIRTABLE_GRANTS_API_TOKEN!,
    );

    const paymentsAirtableURL = airtableUrl(
      process.env.AIRTABLE_PAYMENTS_BASE_ID!,
      process.env.AIRTABLE_PAYMENTS_TABLE_NAME!,
    );

    const paymentsRegionAirtableURL = airtableUrl(
      process.env.AIRTABLE_PAYMENTS_BASE_ID!,
      process.env.AIRTABLE_PAYMENTS_REGIONS_TABLE_NAME!,
    );

    const superteam = Superteams.find(
      (s) =>
        s.country.some(
          (c) => c.toLowerCase() === application.user.location?.toLowerCase(),
        ) || s.region === application.user.location,
    );

    const regionName = superteam
      ? superteam.airtableKey || superteam.displayValue
      : 'Global';

    const region = await fetchAirtableRecordId(
      paymentsRegionAirtableURL,
      'Country',
      regionName,
      grantsAirtableConfig,
    );

    const airtableData = grantApplicationToAirtable(
      application,
      region || '',
      grantTranche,
    );

    const airtablePayload = airtableInsert([{ fields: airtableData }]);

    const response = await axios.post(
      paymentsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error in addPaymentInfoToAirtable: ${error.message}`);
    if (error.response) {
      console.error(
        `Airtable API error response: ${safeStringify(error.response.data)}`,
      );
      console.error(`Airtable API error status: ${error.response.status}`);
      console.error(
        `Airtable API error headers: ${safeStringify(error.response.headers)}`,
      );
    } else if (error.request) {
      console.error(
        `Airtable API no response received: ${safeStringify(error.request)}`,
      );
    }
    throw error;
  }
}
