import { collect } from "./util/collect.ts";
import { test, assertEquals } from "https://deno.land/x/std/testing/mod.ts";

test({
  name: "Parses all of the invalid IDLs to check that they blow up correctly",
  fn(): void {
    for (const test of collect("assets/invalid", { expectError: true, raw: true })) {
      //it(`should produce the right error for ${test.path}`, () => {
        const err = test.readText();
        if (test.error) {
          assertEquals(test.error.message + "\n", err);
        } else if (test.validation) {
          const messages = test.validation
            .map(v => `(${v.ruleName}) ${v.message}`)
            .join("\n");
          assertEquals(messages + "\n", err);
        } else {
          throw new Error("This test unexpectedly had no error");
        }
     // });
    }
  }
});;