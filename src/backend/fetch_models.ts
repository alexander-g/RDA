#!./deno.sh run --no-prompt --allow-read=./models --allow-write=./models --allow-net=github.com,objects.githubusercontent.com

import { base } from "../common/dep.ts"
//TODO
import { path, fs } from "../../base/backend/ts/dep.ts"


type SpecItem = {
    /** Source url */
    url:  URL;
    /** Destination path, relative to models directory */
    path: string;
}

function read_specfile(specfile:string): SpecItem[]|Error {
    const specpermission:Deno.PermissionState 
        = Deno.permissions.querySync({name:"read", path:specfile}).state
    if(specpermission != 'granted')
        return new Error(`No read permissions for ${specfile}`)
    
    const specs:unknown 
        = base.util.parse_json_no_throw(Deno.readTextFileSync(specfile))
    if(base.util.is_array_of_type(specs, validate_spec_item)){
        return specs;
    }
    else return new Error(`Models specfile ${specfile} has unexpected format`)
}

function validate_spec_item(x:unknown): SpecItem|null {
    if(base.util.is_object(x)
    && base.util.has_string_property(x, 'url')
    && base.util.has_string_property(x, 'path')){
        let url:URL;
        try { 
            url = new URL(x.url); 
        } 
        catch (_e) { return null; }

        return {url, path:x.path};
    }
    else return null;
}

function check_permissions(modelsdir:string): true|Error {
    const readpermission:Deno.PermissionState 
        = Deno.permissions.querySync({name:"read", path:modelsdir}).state
    const writepermission:Deno.PermissionState 
        = Deno.permissions.querySync({name:"write", path:modelsdir}).state
    
    if(readpermission != 'granted' || writepermission != 'granted')
        return new Error(`No read/write permissions for ${modelsdir}`)
    return true;
}


/** Check if pytorch libraries are present, download if needed. */
export async function ensure_models(
    specfile: string, 
    modelsdir:string
): Promise<true|Error> {
    const status:true|Error = check_permissions(modelsdir)
    const specs:SpecItem[]|Error = read_specfile(specfile)
    if(specs instanceof Error || status instanceof Error)
        return specs as Error;
    
    // deno-lint-ignore no-inferrable-types
    let n_models:number = 0;
    for(const spec of specs){
        const full_path:string = path.join(modelsdir, spec.path)
        if(!fs.existsSync(full_path)){
            console.log(`Downloading ${spec.url}`)
            const result: Response|Error = await base.util.fetch_no_throw(spec.url)
            if(result instanceof Error){
                console.log(`Unable to download ${spec.url}`)
                console.log(result as Error)
                continue;
            }

            fs.ensureDirSync(path.dirname(full_path))
            Deno.writeFileSync(
                full_path, new Uint8Array(await result.arrayBuffer())
            )
        }
        n_models++;
    }

    if(n_models == 0)
        return new Error('No models available')
    
    return true;
}



if(import.meta.main) {
    const status:true|Error = await ensure_models('./models/models.json', './models/')
    if(status instanceof Error)
        console.log(status);
    else
        console.log('Done');
}
