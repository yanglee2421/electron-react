import type * as cmd from "#main/features/cmd/types";
import type * as db from "#main/features/db/types";
import type * as image from "#main/features/image/types";
import type * as kv from "#main/features/kv/types";
import type * as logger from "#main/features/logger/types";
import type * as mdb from "#main/features/mdb/types";
import type * as plc from "#main/features/plc/types";
import type * as profile from "#main/features/profile/types";
import type * as xml from "#main/features/xml/types";
import type * as infra from "#main/infra/types";

export interface IPCContract
  extends cmd.IPCContract,
    db.IPCContract,
    image.IPCContract,
    kv.IPCContract,
    logger.IPCContract,
    mdb.IPCContract,
    plc.IPCContract,
    profile.IPCContract,
    xml.IPCContract,
    infra.IPCContract {}
