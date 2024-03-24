#!./deno.sh run --no-prompt --unstable --allow-ffi --allow-net=0.0.0.0:5050,cdn.jsdelivr.net,download.pytorch.org,github.com,objects.githubusercontent.com --allow-read --allow-write=./ --allow-env=DENO_DIR

import * as server from "./base/server.ts"
import * as agar   from "./src/common/agar.ts"
import { ensure_libtorch } from "./src/backend/fetch_libtorch.ts";
import { ensure_models }   from "./src/backend/fetch_models.ts";

//TODO:
import { path, flags, fs } from "./base/backend/ts/dep.ts"


type Args = {
    'devmode':      boolean, 
    'compile-only': boolean,
}

function parse_args(): Args {
    return flags.parse(
        Deno.args, 
        {
            default:   {devmode:true, 'compile-only':false},
            boolean:   ['devmode', 'compile-only'],
            negatable: ['devmode'],
        }
    )
}



if(import.meta.main){
    const args:Args = parse_args()

    if(!args["compile-only"]){
        const torchstatus:true|Error = await ensure_libtorch('./assets')
        if(torchstatus instanceof Error){
            console.log(torchstatus.message);
            Deno.exit(1);
        }

        const modelstatus:true|Error 
            = await ensure_models('./models/models.json', './models')
        if(modelstatus instanceof Error){
            console.log(modelstatus.message);
            Deno.exit(1);
        }
    }

    //NOTE: need absolute path for recompilation in devmode
    //NOTE: but in release import.meta will be hard-coded during `deno compile`
    const rootpath:string 
        = args.devmode? path.fromFileUrl(import.meta.resolve('./')) : './';
    const ts_lib_filename:string 
        = Deno.build.os == 'windows' ? 'TSinterface.dll.enc' : 'libTSinterface.so';
    const ts_lib_path:string = path.join('assets', ts_lib_filename)

    const app = new server.App(
        {
            static:    path.join(rootpath, 'static'),
            frontend:  path.join(rootpath, 'src', 'frontend'),
            index_tsx: 'index.tsx',
            dep_ts:    'dep.ts',
            //TODO:
            stubs:[path.join(rootpath, './base/frontend/ts/dep.deno.ts')]
        }, 
        agar.AgarRootDetectionResult,
        path.join(rootpath, ts_lib_path),
        path.join(rootpath, './models/'),
        //recompile if not --no-devmode
        args.devmode,
        //open webbrowser if --no-devmode
        !args.devmode,
    )

    if(args["compile-only"])
        await app.recompile_ui()
    else
        await app.run()
}
