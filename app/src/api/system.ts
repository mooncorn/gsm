import { createEventSource } from "./config";

export const systemApi = {
  streamResources: () => {
    return createEventSource("/system/resources/stream");
  },
};
