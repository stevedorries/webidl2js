"use strict";

import { Tokeniser } from "./tokeniser.ts";
import { Enum } from "./productions/enum.ts";
import { Includes } from "./productions/includes.ts";
import { ExtendedAttributes } from "./productions/extended-attributes.ts";
import { Typedef } from "./productions/typedef.ts";
import { CallbackFunction } from "./productions/callback.ts";
import { Interface } from "./productions/interface.ts";
import { Mixin } from "./productions/mixin.ts";
import { Dictionary } from "./productions/dictionary.ts";
import { Namespace } from "./productions/namespace.ts";
import { CallbackInterface } from "./productions/callback-interface.ts";
import { autoParenter } from "./productions/helpers.ts";

export type Definition = CallbackInterface | CallbackFunction | Interface | Mixin | Dictionary | Enum | Typedef | Includes | Namespace;
export type Partials = Dictionary | Interface | Mixin | Namespace;
export type Interfaces = Mixin | Interface;
export type Callback = CallbackFunction | CallbackInterface;


function parseByTokens(tokeniser: Tokeniser, options: {concrete: boolean}) {
  const source = tokeniser.source;

  function error(str: string) {
    tokeniser.error(str);
  }

  function consume(...candidates: string[]) {
    return tokeniser.consume(...candidates);
  }

  function callback(): Callback {
    const callback = consume("callback");
    if (!callback) return;
    if (tokeniser.probe("interface")) {
      return CallbackInterface.parse(tokeniser, callback);
    }
    return CallbackFunction.parse(tokeniser, callback);
  }

  function interface_(opts?): Interfaces {
    const base = consume("interface");
    if (!base) return;
    const ret = Mixin.parse(tokeniser, {...opts, base}) ||
      Interface.parse(tokeniser, {...opts, base}) ||
      error("Interface has no proper body");
    return ret;
  }

  function partial(): Partials {
    const partial = consume("partial");
    if (!partial) return;
    return Dictionary.parse(tokeniser, { partial }) ||
      interface_({ partial }) ||
      Namespace.parse(tokeniser, { partial }) ||
      error("Partial doesn't apply to anything") as any;
  }

  function definition(): Definition {
    return callback() ||
      interface_() ||
      partial() ||
      Dictionary.parse(tokeniser) ||
      Enum.parse(tokeniser) ||
      Typedef.parse(tokeniser) ||
      Includes.parse(tokeniser) ||
      Namespace.parse(tokeniser);
  }

  function definitions(): Definition[] {
    if (!source.length) return [];
    const defs = [];
    while (true) {
      const ea = ExtendedAttributes.parse(tokeniser);
      const def = definition();
      if (!def) {
        if (ea.length) error("Stray extended attributes");
        break;
      }
      autoParenter(def).extAttrs = ea;
      defs.push(def);
    }
    const eof = consume("eof");
    if (options.concrete) {
      defs.push(eof);
    }
    return defs;
  }
  const res = definitions();
  if (tokeniser.position < source.length) error("Unrecognised tokens");
  return res;
}


export function parse(str: string, options: {sourceName: any, concrete: boolean} = {sourceName: undefined, concrete: undefined}) {
  const tokeniser = new Tokeniser(str);
  if (typeof options.sourceName !== "undefined") {
    (tokeniser.source as any).name = options.sourceName;
  }
  return parseByTokens(tokeniser, options);
}
