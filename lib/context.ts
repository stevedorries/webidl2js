import { Typedef } from "./constructs/typedef.ts";
import { webidl2 } from "./deps.ts";

const builtinTypedefs = webidl2.parse(`
  typedef (Int8Array or Int16Array or Int32Array or
           Uint8Array or Uint16Array or Uint32Array or Uint8ClampedArray or
           Float32Array or Float64Array or DataView) ArrayBufferView;
  typedef (ArrayBufferView or ArrayBuffer) BufferSource;
  typedef unsigned long long DOMTimeStamp;
`);

function defaultProcessor(code) {
  return code;
}

export class Context {
  implSuffix: string;
  processCEReactions: (code: any) => any;
  processHTMLConstructor: (code: any) => any;
  options: any;
  typedefs: Map<any, any>;
  interfaces: Map<any, any>;
  interfaceMixins: Map<any, any>;
  dictionaries: Map<any, any>;
  enumerations: Map<any, any>;
  constructor({
    implSuffix = "",
    processCEReactions = defaultProcessor,
    processHTMLConstructor = defaultProcessor,
    options = undefined
  } = {}) {
    this.implSuffix = implSuffix;
    this.processCEReactions = processCEReactions;
    this.processHTMLConstructor = processHTMLConstructor;
    this.options = options;

    this.initialize();
  }

  initialize() {
    this.typedefs = new Map();
    this.interfaces = new Map();
    this.interfaceMixins = new Map();
    this.dictionaries = new Map();
    this.enumerations = new Map();

    for (const typedef of builtinTypedefs) {
      this.typedefs.set(typedef.name, new Typedef(this, typedef));
    }
  }

  typeOf(name) {
    if (this.typedefs.has(name)) {
      return "typedef";
    }
    if (this.interfaces.has(name)) {
      return "interface";
    }
    if (this.dictionaries.has(name)) {
      return "dictionary";
    }
    if (this.enumerations.has(name)) {
      return "enumeration";
    }
    return undefined;
  }

  invokeProcessCEReactions(code, config) {
    return this._invokeProcessor(this.processCEReactions, code, config);
  }

  invokeProcessHTMLConstructor(code, config) {
    return this._invokeProcessor(this.processHTMLConstructor, code, config);
  }

  _invokeProcessor(processor, code, config) {
    const { requires } = config;

    if (!requires) {
      throw new TypeError("Internal error: missing requires object in context");
    }

    const context = {
      addImport(source, imported) {
        return requires.add(source, imported);
      }
    };

    return processor.call(context, code);
  }
}
