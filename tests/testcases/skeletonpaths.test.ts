import * as skpaths from "../../src/common/skeletonpaths.ts"
import { asserts }  from "./dep.ts"





Deno.test('skeletonpath.parse', () => {
    const mockdata = BigInt64Array.from([
        20,50,5,
        30,55,5,
        40,60,5,
        45,60,5,
        20,50,8,
        20,70,8,
        15,90,8,
        10,100,8,
        88,88,15,
        99,99,15,
    ].map(BigInt));

    const paths1:skpaths.Path[]|null = skpaths.validate_raw_output(mockdata.slice(0,5));
    asserts.assertEquals(paths1, null)

    const paths2:skpaths.Path[]|null = skpaths.validate_raw_output(mockdata);
    asserts.assertExists(paths2)
    asserts.assertEquals(paths2.length, 3)
    asserts.assertEquals(paths2[1]?.label, 8)
    asserts.assertEquals(paths2[1]?.points[1], {x:20, y:70})
    asserts.assertEquals(paths2[2]?.points.length, 2)
})



