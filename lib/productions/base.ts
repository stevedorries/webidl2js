import { TokeniserToken } from "../tokeniser.ts";
import { ExtendedAttributes } from "./extended-attributes.ts";

export interface TokenDictionary {
  [x: string]: TokeniserToken;
  nullable?: TokeniserToken;
  separator?: TokeniserToken;
  special?: TokeniserToken;
  value?: TokeniserToken;
  close?: TokeniserToken;
  open?: TokeniserToken;
  secondaryName?: TokeniserToken;
  variadic?: TokeniserToken;
  optional?: TokeniserToken;
  name?: TokeniserToken;
  assign?: TokeniserToken;
  partial?: TokeniserToken;
}

export interface IdlType {
  type?: string;
  generic?: string;
  idlType: string;
  nullable?: boolean;
  uninon?: boolean;
  extAttrs?: ExtendedAttributes[];
}

export class Base {
 
  
  source: TokeniserToken[];
  tokens: TokenDictionary;
  parent: any = null;
  type?: any;
  idlType?: any;
  members?: any[];
  extAttrs?: ExtendedAttributes;
  this: this;
  name?: string;
  partial?: boolean;

  constructor({ source, tokens }: {source: TokeniserToken[], tokens: TokenDictionary}) {
    this.source = source;
    this.tokens = tokens;
    this.this = this;
  }

  toJSON() {
    const json = { type: undefined, name: undefined, inheritance: undefined };
    let proto = this;
    while (proto !== Object.prototype) {
      const descMap = Object.getOwnPropertyDescriptors(proto);
      for (const [key, value] of Object.entries(descMap)) {
        if (value.enumerable || value.get) {
          // @ts-ignore - allow indexing here
          json[key] = this[key];
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    return json;
  }
}
