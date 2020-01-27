import { TokeniserToken } from "../tokeniser.ts";
import { TokenDictionary } from "./base.ts";

// @ts-check

export class ArrayBase<T> extends Array<T> {
  source?: TokeniserToken[];
  tokens?: TokenDictionary;
  parent?: any = null;

  constructor({ source, tokens }: { source?: TokeniserToken[]; tokens?: TokenDictionary }) {
    super();
    this.source = source;
    this.tokens = tokens;
  }
}
