import { JSX }  from "./dep.ts"
import { base } from "./dep.ts"

import * as agar    from "../common/agar.ts"
import * as agartab from "./components/AgarRootDetectionTab.tsx"



// deno-lint-ignore no-inferrable-types
const id:string = 'agar';

class App extends base.create_App({
    id: id,

    AppState:        agartab.AgarRootDetectionAppState,
    ResultClass:     agar.AgarRootDetectionResult,
    InputClass:      agar.AgarRootDetectionInput,

    settingshandler: new base.settings.BaseSettingsHandler,
    backend:         base.RemoteProcessing,

    TopMenu:         base.TopMenu,
    tabs: {
        'Detection': agartab.AgarRootDetectionTab,
    }
}){}


export function Index(): JSX.Element {
    return <html>
        <base.Head title={"Agar-Root-Detector"} import_src={"index.tsx.js"} />
        <App />
    </html>
}

if(base.util.is_browser()){
    base.hydrate_body(<App />, id)
}
