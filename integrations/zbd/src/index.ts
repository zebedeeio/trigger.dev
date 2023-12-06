import { 
  type IO, 
   type TriggerIntegration, 
   type ConnectionAuth, 
   type Json, 
   type IntegrationTaskKey, 
   type IOTask, 
   type RunTaskOptions,
   type RunTaskErrorCallback,
   retry
} from "@trigger.dev/sdk";
import { zbd as ZBDClient } from "@zbd/node";

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

export type ZBDIntegrationOptions = {
  id: string;
  apiKey: string;
  contentType? : string;
};

type ZBDType = InstanceType<typeof ZBDClient>;

export class ZBD implements TriggerIntegration {
  private _client?: ZBDType;
  private _io?: IO;
  private _connectionKey?: string;
  private _options: ZBDIntegrationOptions;

  constructor(private options: ZBDIntegrationOptions) {
    this._options = options;
  }

  get authSource() {
    return this._options.apiKey ? ("LOCAL" as const) : ("HOSTED" as const);
  }

  cloneForRun(io: IO, connectionKey: string, auth?: ConnectionAuth) {
    const apiKey = this._options.apiKey ?? auth?.accessToken;

    if (!apiKey) {
      throw new Error(
        `Can't create ZBD integration (${this._options.id}) as apiKey was undefined`
      );
    }

    const zbd = new ZBD(this._options);
    zbd._io = io;
    zbd._connectionKey = connectionKey;
    zbd._client = new ZBDClient(apiKey);
    return zbd;
  };

  get id() {
    return this.options.id;
  }

  get metadata() {
    return { id: "zbd", name: "ZBD" };
  }
  
  runTask<T, TResult extends Json<T> | void>(
    key: IntegrationTaskKey,
    callback: (client: ZBDType, task: IOTask, io: IO) => Promise<TResult>,
    options: RunTaskOptions,
    errorCallback?: RunTaskErrorCallback
  ): Promise<TResult> {
    if (!this._io) throw new Error("No IO");
    if (!this._connectionKey) throw new Error("No connection key");

    return this._io.runTask(
      key,
      (task, io) => {
        if (!this._client) throw new Error("No client");
        return callback(this._client, task, io);
      },
      { icon: "zbd", ...(options ?? {}), connectionKey: this._connectionKey },
      errorCallback
    );
  }

  sendLightningAddressPayment(key: IntegrationTaskKey, params: SendLNAddressPaymentData): Promise<SendLNAddressPaymentResponse> {
    return this.runTask(
      key,
      (client) => {
        return client.sendLightningAddressPayment(params) as Promise<SendLNAddressPaymentResponse>;
      },
      {
        name: "Send Lightning Payment",
        params,
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
        retry: retry.standardBackoff,
      }
    );
  };
}