import { base } from "./dep.ts"
import { Path, validate_raw_output } from "./skeletonpaths.ts"


export class AgarRootDetectionInput extends base.files.InputFile {}

export
class AgarRootDetectionResult extends base.instseg.InstanceSegmentationResult {
    paths: Path[]|null;

    constructor(...args:[
        ...ConstructorParameters<typeof base.instseg.InstanceSegmentationResult>,
        paths?:Path[]
    ]){
        let [status, raw, inputname, classmap, instancemap, paths] = args;
        
        if(status == 'processed' && paths === undefined)
            status = 'unprocessed';
        
        super(status, raw, inputname, classmap, instancemap);
        this.paths = paths ?? null;
    }

    async export(): Promise<Record<string, File> | null> {
        const exported: Record<string,File>|null = await super.export()
        if(exported != null && this.paths != null){
            const jsonpaths:string = JSON.stringify(this.paths, null, 2)
            exported['paths.json'] 
                = new File([jsonpaths], 'paths.json')
            const roi_zip:File|Error = await export_paths_to_image_j_roi(this.paths)
            
            if(roi_zip instanceof Error)
                return null;
            
            exported['paths.image_j.zip'] = roi_zip;
        }
        return exported
    }

    static async validate<T extends base.files.Result>(
        this: new (...args:ConstructorParameters<typeof AgarRootDetectionResult>) => T, 
        raw:  unknown,
    ): Promise<T|null> {
        const baseresult: base.instseg.InstanceSegmentationResult|null
             = await super.validate(raw)
        if(baseresult === null)
            return null;
        
        raw = baseresult.raw;

        // load from zip file
        if(raw instanceof Blob){
            const zipcontents: base.zip.Files|Error = await base.zip.unzip(raw as File)
            if(zipcontents instanceof Error)
                return null;
            
            if('paths.json' in zipcontents){
                const paths_file:File = zipcontents['paths.json']
                const paths: Path[]|null = validate_paths(
                    base.util.parse_json_no_throw(await paths_file.text())
                )
                if(paths == null)
                    return null;

                return new this(
                    'processed', 
                    raw, 
                    baseresult.inputname, 
                    baseresult.classmap ?? undefined,
                    baseresult.instancemap ?? undefined,
                    paths,
                )
            }
            else return null;
            
        }

        // from TS output
        if(is_session_output(raw)){
            const paths:Path[]|null = validate_raw_output(raw.output.paths.data)
            if(paths != null){
                return new this(
                    'processed', 
                    raw, 
                    baseresult.inputname, 
                    baseresult.classmap ?? undefined,
                    baseresult.instancemap ?? undefined,
                    paths,
                )
            }
            else return null;
        }
        else return null;
    }
}



async function export_paths_to_image_j_roi(paths:Path[]): Promise<File|Error> {
    const files:base.zip.Files = {}
    for(const path of paths){
        const label:string = (path.label).toString();
        //TODO: DIRTY TEMPORARY WORKAROUND, REMOVE THIS
        const points_flipped:base.util.Point[] = path.points.map(
            (p:base.util.Point) => ({x:p.y, y:p.x})
        )
        const roi = base.image_j.RoI.freeline_from_points(points_flipped, label)
        const bytes:ArrayBuffer = roi.tobytes()
        files[`${label}.roi`] = new File([bytes], `${label}.roi`)
    }
    // NOTE: compression (true) is important. ImageJ fails with uncompressed zip
    return base.zip.zip_files(files, 'paths.image_j.zip', true)
}




function validate_point(x:unknown): base.util.Point|null {
    if(base.util.is_object(x)
    && base.util.has_number_property(x, 'x')
    && base.util.has_number_property(x, 'y')){
        return x;
    }
    else return null;
}

function validate_points(x:unknown): base.util.Point[]|null {
    if(base.util.is_array_of_type(x, validate_point)){
        return x;
    }
    else return null
}

function validate_path(x:unknown): Path|null {
    if(base.util.is_object(x)
    && base.util.has_number_property(x, 'label')
    && base.util.has_property_of_type(x, 'points', validate_points)){
        return x;
    }
    else return null;
}

function validate_paths(x:unknown): Path[]|null {
    if(base.util.is_array_of_type(x, validate_path)){
        return x;
    }
    else return null
}




/** Partial format returned by running instance segmentation models in TorchScript */
export type TS_Output = {
    "paths": base.backend_common.Tensor<'int64'>;
}

export type Session_Output = {
    output: TS_Output;
}

export function validate_ts_output(raw:unknown): TS_Output|null {
    if(base.util.is_object(raw)
    && base.util.has_property_of_type(raw, 'paths', base.backend_common.validate_tensor)){
        if(raw['paths'].shape.length == 2   // (Nx3)
        && raw['paths'].shape[1]     == 3   // x&y coordinates + label
        && raw['paths'].dtype        == 'int64'){
            return raw as TS_Output;
        }
        else return null;
    }
    else return null;
}

export function validate_session_output(x:unknown): Session_Output|null {
    //TODO: code duplication with objectdetection.ts
    if(base.util.is_object(x)
    && base.util.has_property_of_type(x, 'output', validate_ts_output)){
        return x;
    }
    else return null;
}

export function is_session_output(x:unknown): x is Session_Output {
    return validate_session_output(x) === x;
}

