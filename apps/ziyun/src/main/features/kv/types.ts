export interface IPCContract {
  "kv/get": {
    args: [string];
    return: string | null;
  };
  "kv/set": {
    args: [string, string];
    return: void;
  };
  "kv/remove": {
    args: [string];
    return: void;
  };
  "kv/clear": {
    args: [];
    return: void;
  };
}

export interface KVEvent {
  action: "set" | "remove" | "clear";
  key?: string;
  value?: string;
}
