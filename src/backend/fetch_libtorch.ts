#!./deno.sh run --allow-read=./assets --allow-write=./assets --allow-net=download.pytorch.org

import { base } from "../common/dep.ts"

//TODO
import { path, fs } from "../../base/backend/ts/dep.ts"



/** Supported operating systems */
type OS = 'linux'|'windows';


const LIBTORCH_URLs:{[K in OS]:URL} = {
    linux: new URL(
        'https://download.pytorch.org/libtorch/cpu/libtorch-shared-with-deps-2.1.2%2Bcpu.zip'
    ),
    windows: new URL(
        'https://download.pytorch.org/libtorch/cpu/libtorch-win-shared-with-deps-2.1.2%2Bcpu.zip'
    ),
};

const LIBTORCH_FILES:{[K in OS]:string[]} = {
    linux:   ['libtorch.so', 'libtorch_cpu.so', 'libc10.so', 'libgomp-a34b3233.so.1'],
    windows: [
        'torch.dll', 'torch_cpu.dll', 'c10.dll', 
        'uv.dll', 'asmjit.dll', 'libiomp5md.dll', 'fbgemm.dll'
    ],
}


type LIBTORCH_STATUS = 'initialized'|URL|Error;

function perform_checks(destination:string): LIBTORCH_STATUS {
    const os:string = Deno.build['os'];
    if(os != 'windows' && os != 'linux'){
        return new Error(`Unsupported OS: ${os}`)
    }

    const readpermission: Deno.PermissionState 
        = Deno.permissions.querySync({name:'read', path:destination}).state;
    if(readpermission != 'granted'){
        return new Error(`Insufficient permissions: --allow-read=${destination}`)
    }

    const url:URL = LIBTORCH_URLs[os];
    const netpermissions:Deno.PermissionState 
        = Deno.permissions.querySync({name:'net', host:url.host}).state;
    const writepermission: Deno.PermissionState 
        = Deno.permissions.querySync({name:'write', path:destination}).state;

    for(const filename of LIBTORCH_FILES[os]){
        if( !fs.existsSync(path.join(destination, filename)) ){
            if(writepermission != 'granted' || netpermissions != 'granted')
                return new Error(
                    `Download required but lacking permissions:\n`
                    + `\t--allow-write=${destination}\n`
                    + `\t--allow-net=${url.host}\n`
                )
            else return url;
        }
    }
    //all files exist, no download required
    return 'initialized';
}

async function unzip_libtorch(destination:string, zipfile:Blob): Promise<true|Error> {
    const zipcontent:base.zip.Files|Error = await base.zip.unzip(zipfile)
    if(zipcontent instanceof Error)
        return zipcontent as Error;
    
    const os:string = Deno.build['os'];
    if(os != 'windows' && os != 'linux'){
        //should not happen, checked previously
        return new Error(`Unsupported OS: ${os}`)
    }

    const filenames:string[] = LIBTORCH_FILES[os];
    const libpath = 'libtorch/lib';
    for(const filename of filenames){
        //NOTE: not using path.join because it will join with backslash on windows
        const filepath = `${libpath}/${filename}`;
        const unzipped_file:File|undefined = zipcontent[filepath]
        if(unzipped_file == undefined)
            return new Error(`File ${filename} missing in zipfile`)
        
        const data = new Uint8Array(await unzipped_file.arrayBuffer())
        fs.ensureDirSync(destination)
        Deno.writeFileSync(path.join(destination, filename), data);
    }
    return true;
}


/** Check if pytorch libraries are present, download if needed. */
export async function ensure_libtorch(destination:string): Promise<true|Error> {
    const status:LIBTORCH_STATUS = perform_checks(destination)
    if(status instanceof Error)
        return status as Error;
    
    if(status == 'initialized')
        return true;
    
    const url:URL = status;
    console.log(`Downloading ${url.href}`)
    const response:Response|Error = await base.util.fetch_no_throw(url)
    if(response instanceof Error)
        return response as Error;
    
    return unzip_libtorch(destination, await response.blob())
}


if(import.meta.main) {
    const status:true|Error = await ensure_libtorch('./assets/')
    if(status instanceof Error)
        console.log(status);
    else
        console.log('Done');
}
