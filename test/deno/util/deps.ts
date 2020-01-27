import * as _path from "https://deno.land/std/path/mod.ts";
import * as _fs from "https://deno.land/std/fs/mod.ts";

export const fs = _fs;
export const path = _path;

function __({ url = import.meta.url }: { url: string }) {
    const u: URL = new URL(url);
    const f: string = u.protocol === 'file:' ? u.pathname : url;
    const d: string = f.replace(/[/][^/]*$/, '');
    return {
      d,
      f,
      dirname: d,
      filename: f,
      __dirname: d,
      __filename: f,
    };
  }
  
  export function dirname(meta: { url: string }) {
    return __(meta).__dirname;
  }
  
  export function filename(meta: { url: string }) {
    return __(meta).__filename;
  }