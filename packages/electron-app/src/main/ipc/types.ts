import type * as cmd from "#main/features/cmd/types";
import type * as db from "#main/features/db/types";
import type * as kv from "#main/features/kv/types";
import type * as mdb from "#main/features/mdb/types";
import type * as plc from "#main/features/plc/types";
import type * as profile from "#main/features/profile/types";

export interface IPCContract
  extends cmd.IPCContract,
    db.IPCContract,
    kv.IPCContract,
    mdb.IPCContract,
    plc.IPCContract,
    profile.IPCContract {}
