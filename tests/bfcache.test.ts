import * as bfcache from "./bfcache.ts";
import * as common from "./common.ts";
import * as noBfcache from "./no-bfcache.ts";
import { runTest } from "./util.ts";

runTest(common.params);
runTest(bfcache.params);
runTest(noBfcache.params, "fail");
