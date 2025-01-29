import { apiUrl } from "../config/constants";

export const systemApi = {
  streamResources: () => {
    const eventSourceInit: EventSourceInit = {
      withCredentials: true,
    };

    return new EventSource(
      `${apiUrl}/system/resources/stream`,
      eventSourceInit
    );
  },
};
