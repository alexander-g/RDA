#!./deno.sh run --no-prompt --unstable --allow-ffi --allow-net=0.0.0.0:5050,cdn.jsdelivr.net,download.pytorch.org --allow-read --allow-write=./ --allow-env=DENO_DIR

import * as server from "./base/server.ts"
import * as agar   from "./src/common/agar.ts"
import { ensure_libtorch } from "./src/backend/fetch_libtorch.ts";

//TODO:
import { path, flags } from "./base/backend/ts/dep.ts"



function parse_args(): Record<string, string> {
    const args:Record<string, string>  = flags.parse(
        Deno.args, 
        {
            default:{recompile:true},
            negatable:['recompile'],
        }
    )
    return args;
}



if(import.meta.main){
    const args:Record<string, string> = parse_args()

    const torchstatus:true|Error = await ensure_libtorch('./assets')
    if(torchstatus instanceof Error){
        console.log(torchstatus.message);
        Deno.exit(1);
    }

    const rootpath:string = path.fromFileUrl(
        import.meta.resolve('./')
    );
    const join: (...paths:string[]) => string = path.join;
    await (new server.App(
        {
            static:    join(rootpath, 'static'),
            frontend:  join(rootpath, 'src', 'frontend'),
            index_tsx: 'index.tsx',
            dep_ts:    'dep.ts',
            //TODO:
            stubs:[join(rootpath, './base/frontend/ts/dep.deno.ts')]
        }, 
        agar.AgarRootDetectionResult,
        join(rootpath, './assets/libTSinterface.so'),
        join(rootpath, './models/'),
        //recompile if not --no-recompile
        Boolean(args.recompile),
        //open webbrowser if --no-recompile
        !(args.recompile),
    )).run()
}
