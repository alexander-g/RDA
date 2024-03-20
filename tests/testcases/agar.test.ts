import * as agar   from "../../src/common/agar.ts"
import { base }    from "../../src/common/dep.ts"

import { asserts } from "./dep.ts"




Deno.test("agar-result.export-import", async (t:Deno.TestContext) => {
    const inputfilename = 'inputfilename.jpg'
    const paths = [{
        points: [
            {x:20, y:30}, 
            {x:25, y:20},
            {x:55, y:30},
        ],
        label: 9999,
    }]
    const result0 = new agar.AgarRootDetectionResult(
        'processed',
        null,
        inputfilename,
        new File([], 'classmap.png'),
        new File([], 'instancemap.png'),
        paths,
    )

    const exported = await result0.export()
    asserts.assertExists(exported)
    
    const zipfile = await base.files.combine_exports(exported, result0.inputname!)
    asserts.assertNotInstanceOf(zipfile, Error)

    await t.step('basic_zip', async() =>{
        const result1 = await agar.AgarRootDetectionResult.validate(zipfile)
        asserts.assertExists(result1)
        asserts.assertEquals(result1.status, 'processed')
    })

    await t.step('on_drop', async() =>{
        const input = {name: inputfilename}
        const result2 = await agar.AgarRootDetectionResult.validate({input, file:zipfile})
        asserts.assertExists(result2)
        asserts.assertEquals(result2.status, 'processed')
    })
})
