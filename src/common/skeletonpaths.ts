import { base } from "./dep.ts"




export type Path = {
    points: base.util.Point[];
    label:  number;
}


/** Convert a raw tensor as encoded in outputs of TS modules to {@link Path}s.
 *  i.e. [Nx3] arrays of (x,y,label) */
export function validate_raw_output(raw:unknown): Path[]|null {
    if((raw instanceof BigInt64Array)
    && (raw.length % 3 == 0)  ) {
        const paths:Path[] = [];
        let current_points:base.util.Point[] = [];
        let current_label:bigint|null   = null;

        // deno-lint-ignore no-inferrable-types
        for(let i:number = 0; i < raw.length; i += 3){
            const [x,y] = [raw[i+0]!, raw[i+1]!]
            const label:bigint = raw[i+2]!
            if(label != current_label){
                if(current_points.length > 0){
                    paths.push({
                        points: current_points,
                        label:  Number(current_label),
                    })
                }
                current_label  = label;
                current_points = []
            }
            current_points.push({x:Number(x), y:Number(y)})
        }

        if(current_points.length > 0){
            paths.push({
                points: current_points,
                label:  Number(current_label),
            })
        }

        return paths;
    }
    else return null;
}
