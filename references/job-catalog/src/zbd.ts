import { createExpressServer } from "@trigger.dev/express";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { ZBD } from "@trigger.dev/zbd";

export const zbd = new ZBD({ id: "slack" });

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
    await io.zbd.sendLightningAddressPayment({
      lnAddress: "andre@zbd.gg",
      amount: "100000",
    });
  },
});

createExpressServer(client);
