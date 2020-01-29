import {
  dirname,
  fs,
  path,
  webidl2,
  prettier,
  prettierPlugins
} from "./deps.ts";
import { Context } from "./context.ts";
import { Interface } from "./constructs/interface.ts";
import { Typedef } from "./constructs/typedef.ts";
import { InterfaceMixin } from "./constructs/interface-mixin.ts";
import { Dictionary } from "./constructs/dictionary.ts";
import { Enumeration } from "./constructs/enumeration.ts";

const __dirname = dirname({ url: import.meta.url });
const utf8Decoder = new TextDecoder("utf-8");
const utf8Encoder = new TextEncoder();

export interface TransformerOptions {
  suppressErrors?: any;
  processHTMLConstructor?: (code: any) => any;
  processCEReactions?: (code: any) => any;
  implSuffix?: string;
}

export interface SourcePaths {
  idlPath?: string;
  impl?: string;
}

export class Transformer {
  ctx: Context;
  sources: { idlPath: string; impl: string }[];
  utilPath: string;
  constructor(opts: TransformerOptions = {}) {
    this.ctx = new Context({
      implSuffix: opts.implSuffix,
      processCEReactions: opts.processCEReactions,
      processHTMLConstructor: opts.processHTMLConstructor,
      options: {
        suppressErrors: Boolean(opts.suppressErrors)
      }
    });

    this.sources = []; // Absolute paths to the IDL and Impl directories.
    this.utilPath = null;
  }

  addSource(idl: string, impl: string) {
    if (typeof idl !== "string") {
      throw new TypeError("idl path has to be a string");
    }
    if (typeof impl !== "string") {
      throw new TypeError("impl path has to be a string");
    }
    this.sources.push({ idlPath: path.resolve(idl), impl: path.resolve(impl) });
    return this;
  }

  async _collectSources() {
    const stats = await Promise.all(
      this.sources.map(src => Deno.stat(src.idlPath))
    );
    const files: SourcePaths[] = [];
    for (let i = 0; i < stats.length; ++i) {
      if (stats[i].isDirectory()) {
        const folderContents = fs.walk(this.sources[i].idlPath);
        for (const file in folderContents) {
          if (file.endsWith(".webidl")) {
            files.push({
              idlPath: path.join(this.sources[i].idlPath, file),
              impl: this.sources[i].impl
            });
          }
        }
      } else {
        files.push({
          idlPath: this.sources[i].idlPath,
          impl: this.sources[i].impl
        });
      }
    }
    return files;
  }

  async _readFiles(files: SourcePaths[]) {
    const zipped = [];
    const fileContents = (
      await Promise.all(files.map(f => Deno.readFile(f.idlPath)))
    ).map(cont => utf8Decoder.decode(cont));
    for (let i = 0; i < files.length; ++i) {
      zipped.push({
        idlContent: fileContents[i],
        impl: files[i].impl
      });
    }
    return zipped;
  }

  _parse(outputDir: string, contents: any[]) {
    const parsed = contents.map(
      (content: { idlContent: string; impl: string }) => ({
        idl: webidl2.parse(content.idlContent),
        impl: content.impl
      })
    );

    this.ctx.initialize();
    const {
      interfaces,
      interfaceMixins,
      dictionaries,
      enumerations,
      typedefs
    } = this.ctx;

    // first we're gathering all full interfaces and ignore partial ones
    for (const file of parsed) {
      for (const instruction of file.idl) {
        let obj: { name: any };
        switch (instruction.type) {
          case "interface":
            if (instruction.partial) {
              break;
            }

            obj = new Interface(this.ctx, instruction, {
              implDir: file.impl
            });
            interfaces.set(obj.name, obj);
            break;
          case "interface mixin":
            if (instruction.partial) {
              break;
            }

            obj = new InterfaceMixin(this.ctx, instruction);
            interfaceMixins.set(obj.name, obj);
            break;
          case "includes":
            break; // handled later
          case "dictionary":
            if (instruction.partial) {
              break;
            }

            obj = new Dictionary(this.ctx, instruction);
            dictionaries.set(obj.name, obj);
            break;
          case "enum":
            obj = new Enumeration(this.ctx, instruction);
            enumerations.set(obj.name, obj);
            break;
          case "typedef":
            obj = new Typedef(this.ctx, instruction);
            typedefs.set(obj.name, obj);
            break;
          default:
            if (!this.ctx.options.suppressErrors) {
              throw new Error("Can't convert type '" + instruction.type + "'");
            }
        }
      }
    }

    // second we add all partial members and handle includes
    for (const file of parsed) {
      for (const instruction of file.idl) {
        let oldMembers: any[];
        let extAttrs: any[];
        switch (instruction.type) {
          case "interface":
            if (!instruction.partial) {
              break;
            }

            if (
              this.ctx.options.suppressErrors &&
              !interfaces.has(instruction.name)
            ) {
              break;
            }
            oldMembers = interfaces.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = interfaces.get(instruction.name).idl.extAttrs;
            extAttrs.push(...instruction.extAttrs);
            break;
          case "interface mixin":
            if (!instruction.partial) {
              break;
            }

            if (
              this.ctx.options.suppressErrors &&
              !interfaceMixins.has(instruction.name)
            ) {
              break;
            }
            oldMembers = interfaceMixins.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = interfaceMixins.get(instruction.name).idl.extAttrs;
            extAttrs.push(...instruction.extAttrs);
            break;
          case "dictionary":
            if (!instruction.partial) {
              break;
            }
            if (
              this.ctx.options.suppressErrors &&
              !dictionaries.has(instruction.name)
            ) {
              break;
            }
            oldMembers = dictionaries.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = dictionaries.get(instruction.name).idl.extAttrs;
            extAttrs.push(...instruction.extAttrs);
            break;
          case "includes":
            if (
              this.ctx.options.suppressErrors &&
              !interfaces.has((instruction as any).target)
            ) {
              break;
            }
            interfaces
              .get((instruction as any).target)
              .includes((instruction as any).includes);
            break;
        }
      }
    }
  }

  async _writeFiles(outputDir: string) {
    const utilsText = await Deno.readFile(
      path.resolve(__dirname, "output/utils.js")
    );

    await Deno.writeFile(this.utilPath, utilsText);

    const { interfaces, dictionaries, enumerations } = this.ctx;

    for (const obj of interfaces.values()) {
      let source = obj.toString();

      let implFile = path.relative(
        outputDir,
        path.resolve(obj.opts.implDir, obj.name + this.ctx.implSuffix)
      );
      implFile = implFile.replace(/\\/g, "/"); // fix windows file paths
      if (implFile[0] !== ".") {
        implFile = "./" + implFile;
      }

      let relativeUtils = path
        .relative(outputDir, this.utilPath)
        .replace(/\\/g, "/");
      if (relativeUtils[0] !== ".") {
        relativeUtils = "./" + relativeUtils;
      }

      source = `
        const conversions = `+`require("webidl-conversions");
        import as utils`+` from "${relativeUtils}";
        ${source}
        import * as Impl`+` from "${implFile}.ts";
      `;

      source = this._prettify(source);

      await Deno.writeFile(
        path.join(outputDir, obj.name + ".ts"),
        utf8Encoder.encode(source)
      );
    }

    for (const obj of dictionaries.values()) {
      let source = obj.toString();

      let relativeUtils = path
        .relative(outputDir, this.utilPath)
        .replace(/\\/g, "/");
      if (relativeUtils[0] !== ".") {
        relativeUtils = "./" + relativeUtils;
      }

      source = `
        import * as conversions `+`from "./webidl_conversions.ts");
        import * as utils `+`from "${relativeUtils}";
        ${source}
      `;

      source = this._prettify(source);

      await Deno.writeFile(
        path.join(outputDir, obj.name + ".ts"),
        utf8Encoder.encode(source)
      );
    }

    for (const obj of enumerations.values()) {
      const source = this._prettify(`
        "use strict";

        ${obj.toString()}
      `);
      await Deno.writeFile(
        path.join(outputDir, obj.name + ".ts"),
        utf8Encoder.encode(source)
      );
    }
  }

  _prettify(source: string) {
    return prettier.format(source, {
      printWidth: 120,
      parser: "babel",
      plugins: prettierPlugins
    });
  }

  async generate(outputDir: string) {
    if (!this.utilPath) {
      this.utilPath = path.join(outputDir, "utils.ts");
    }

    const sources = await this._collectSources();
    const contents = await this._readFiles(sources);
    this._parse(outputDir, contents);
    await this._writeFiles(outputDir);
  }
}

