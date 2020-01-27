// @ts-check

import { Base, TokenDictionary } from "./base.ts";
import { unescape } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";

export class Includes extends Base {
  
  static parse(tokeniser: Tokeniser) {
    const target = tokeniser.consume("identifier");
    if (!target) {
      return;
    }
    const tokens: TokenDictionary = { target };
    tokens.includes = tokeniser.consume("includes");
    if (!tokens.includes) {
      tokeniser.unconsume(target.index);
      return;
    }
    (tokens.mixin as any) = tokeniser.consume("identifier") || tokeniser.error("Incomplete includes statement");
    (tokens.termination as any) = tokeniser.consume(";") || tokeniser.error("No terminating ; for includes statement");
    return new Includes({ source: tokeniser.source, tokens });
  }

  get type() {
    return "includes";
  }
  get target() {
    return unescape(this.tokens.target.value);
  }
  get includes() {
    return unescape(this.tokens.mixin.value);
  }
}
