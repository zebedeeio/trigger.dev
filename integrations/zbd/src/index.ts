import type { IntegrationClient, TriggerIntegration } from "@trigger.dev/sdk";
import { ZBD as ZBDClient } from "@zbd/node";

import type { AuthenticatedTask } from "@trigger.dev/sdk";

type SendLNAddressPaymentData = Parameters<InstanceType<typeof ZBDClient>["sendLightningAddressPayment"]>[0];

type SendLNAddressPaymentResponse = {
  success: boolean,
  message: string,
  data: {
    id: string,                    // payment id
    fee: string,                   // fee in satoshis (0 if no fee)
    unit: string,                  // unit of transaction (satoshis)
    amount: string,                // amount in satoshis
    status: string,                // status of transaction
    invoice: string,               // lightning network invoice/charge
    walletId: string,              // id of wallet performing transaction
    createdAt: string,             // timestamp of transaction creation
    transactionId: string,         // transaction id
    comment: string | null,        // comment attached to transaction
    preimage: string | null,       // lightning preimage
    internalId: string | null,     // internal user-entered metadata
    callbackUrl: string | null,    // callback url to receive updates
    processedAt: string | null,    // timestamp of transaction settlement
  },
};

export const sendLightningAddressPayment: AuthenticatedTask<
  InstanceType<typeof ZBDClient>,
  SendLNAddressPaymentData,
  SendLNAddressPaymentResponse
> = {
  run: async (params, client) => {
    return client.sendLightningAddressPayment(params) as Promise<SendLNAddressPaymentResponse>;
  },
  init: (params) => {
    return {
      name: "Send Lightning Payment",
      params,
      icon: "zbd",
      properties: [
        {
          label: "Lightning Address",
          text: params.lnAddress,
        },
        {
          label: "Amount",
          text: params.amount,
        },
        {
          label: "Comment",
          text: params.comment,
        },
      ],
      retry: {
        limit: 8,
        factor: 1.8,
        minTimeoutInMs: 500,
        maxTimeoutInMs: 30000,
        randomize: true,
      },
    };
  },
};

const tasks = {
  sendLightningAddressPayment,
};

export type ZBDIntegrationOptions = {
  id: string;
  apiKey: string;
};

export class ZBD implements TriggerIntegration<IntegrationClient<ZBDClient, typeof tasks>> {
  client: IntegrationClient<ZBDClient, typeof tasks>;

  constructor(private options: ZBDIntegrationOptions) {
    if (Object.keys(options).includes("apiKey") && !options.apiKey) {
      throw `Can't create ZBD integration (${options.id}) as apiKey was undefined`;
    }

    this.client = {
      tasks,
      usesLocalAuth: true,
      client: new ZBDClient(options.apiKey),
      auth: {
        apiKey: options.apiKey,
      },
    };
  }

  get id() {
    return this.options.id;
  }

  get metadata() {
    return { id: "zbd", name: "ZBD" };
  }
}
