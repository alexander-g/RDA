import { base }     from "../dep.ts"
import * as agar    from "../../common/agar.ts"


export class AgarRootDetectionAppState extends base.state.AppState<
    agar.AgarRootDetectionInput, 
    agar.AgarRootDetectionResult, 
    base.settings.BaseSettings
>{}

export class AgarRootDetectionTab<S extends AgarRootDetectionAppState> 
extends base.detectiontab.SegmentationTab<S> {
    /** @override */
    resultclass() {
        return agar.AgarRootDetectionResult;
    }

    /** @override */
    file_table_content(): base.detectiontab.FileTableContent<S> {
        return base.imageoverlay.InstanceSegmentationContent;
    }
}



