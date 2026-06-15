import { net, protocol } from "electron";
import url from "node:url";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ziyun",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

export class AppProtocol {
  dispose() {
    protocol.unhandle("ziyun");
  }

  handle() {
    protocol.handle("ziyun", (request) => {
      const filePath = new URL(request.url).searchParams.get("file")!;

      return net.fetch(url.pathToFileURL(filePath).href);
    });
  }
}
