import { createExpressServer } from "@trigger.dev/express";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { ZBD } from "@trigger.dev/zbd";

export const zbd = new ZBD({ 
  id: "zbd-client",
  apiKey: process.env.ZBD_API_KEY!,
});

export const client = new TriggerClient({
  id: "job-catalog",
  apiKey: process.env["TRIGGER_API_KEY"],
  apiUrl: process.env["TRIGGER_API_URL"],
  verbose: false,
  ioLogLocalEnabled: true,
});

client.defineJob({
  id: "zbd-example",
  name: "ZBD Example Job",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "zbd.example",
  }),
  integrations: {
    zbd,
  },
  run: async (payload, io, ctx) => {
    await io.zbd.sendLightningAddressPayment("send-lighting-address-payment", {
      lnAddress: "andre@zbd.gg",
      amount: "100000",
      comment: "hello",
      callbackUrl: "https://webhook.site/7f7f7f7f-7f7f-7f7f-7f7f-7f7f7f7f7f7f",
      internalId: "123",
    });
  },
});

createExpressServer(client);
