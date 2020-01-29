import * as _path from "https://deno.land/std/path/mod.ts";
import * as _fs from "https://deno.land/std/fs/mod.ts";

import * as _webidl2 from "https://raw.githubusercontent.com/stevedorries/webidl2.js/gh-pages/mod.ts";

export {
  prettier,
  prettierPlugins
} from "https://deno.land/std/prettier/prettier.ts";

export const webidl2 = _webidl2;
export const path = _path;
export const fs = _fs;

function __({ url = import.meta.url }: { url: string }) {
  const u: URL = new URL(url);
  const f: string = u.protocol === "file:" ? u.pathname : url;
  const d: string = f.replace(/[/][^/]*$/, "");
  return {
    d,
    f,
    dirname: d,
    filename: f,
    __dirname: d,
    __filename: f
  };
}

export function dirname(meta: { url: string }) {
  return __(meta).__dirname;
}

export function filename(meta: { url: string }) {
  return __(meta).__filename;
}
