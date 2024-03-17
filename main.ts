#!./deno.sh run --no-prompt --unstable --allow-ffi --allow-net=0.0.0.0:5050,cdn.jsdelivr.net --allow-read --allow-write=./ --allow-env=DENO_DIR

import * as server from "./base/server.ts"
import * as agar   from "./src/common/agar.ts"
import { base }    from "./src/common/dep.ts"


if(import.meta.main){
    await (new server.App(
        './', 
        agar.AgarRootDetectionResult,
        base.backend_deps.path.fromFileUrl(
            import.meta.resolve('./assets/libTSinterface.so')
        ),
        base.backend_deps.path.fromFileUrl(
            import.meta.resolve('./models/')
        ),
    )).run()
}
