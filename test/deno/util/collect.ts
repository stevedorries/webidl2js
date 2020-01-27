import { path as pth, fs, dirname } from "./deps.ts";
import * as wp from "../../../mod.ts";

export interface CollectOptions {
  expectError?: boolean;
  raw?: boolean;
}

/**
 * Collects test items from the specified directory
 */
export function* collect(
  base: string,
  { expectError, raw }: CollectOptions = {}
) {
  base = pth.join(dirname({url:import.meta.url}),"..", base);
  const dir = pth.join(base, "idl");
  // const idls = fs.readdirSync(dir)
  //   .filter(it => (/\.webidl$/).test(it))
  //   .map(it => pth.join(dir, it));
console.log(dir);
  for (const path of fs.walkSync(dir, { exts: [".webidl"] })) {
    try {
      const text = fs.readFileStrSync(path.filename, { encoding: "utf8" });
      const ast = wp.parse(text, {
        concrete: true,
        sourceName: pth.basename(path.filename)
      });
      const validation = wp.validate(ast);
      if (validation) {
        yield new TestItem({ text, ast, path: path.filename, validation, raw });
      } else {
        yield new TestItem({ text, ast, path: path.filename, raw });
      }
    } catch (error) {
      if (expectError && error instanceof wp.WebIDLParseError) {
        yield new TestItem({ path: path.filename, error, raw });
      } else {
        throw error;
      }
    }
  }
}

class TestItem {
  text: any;
  ast: any;
  path: any;
  error: any;
  validation: any;
  baselinePath: string;
  constructor({ text, ast, path, error, validation, raw }: any) {
    this.text = text;
    this.ast = ast;
    this.path = path;
    this.error = error;
    this.validation = validation;
    const fileExtension = raw ? ".txt" : ".json";
    this.baselinePath = pth.join(
      pth.dirname(path),
      "../baseline",
      pth.basename(path).replace(".webidl", fileExtension)
    );
  }

  readJSON() {
    return JSON.parse(this.readText());
  }

  readText() {
    return fs.readFileStrSync(this.baselinePath, { encoding: "utf8" });
  }

  diff(target = this.readJSON()) {
    return {};
    // return jdp.diff(target, this.ast);
  }
} 