// @ts-check

import { Container } from "./container.ts";
import { Field } from "./field.ts";
import { Tokeniser } from "../tokeniser.ts";
import { TokenDictionary } from "./base.ts";

export class Dictionary extends Container {
 
  static parse(tokeniser: Tokeniser, opts: any = { partial: undefined}): Dictionary {
    const tokens: TokenDictionary = opts;
    tokens.base = tokeniser.consume("dictionary");
    if (!tokens.base) {
      return;
    }
    return Container.parse(tokeniser, new Dictionary({ source: tokeniser.source, tokens }), {
      type: "dictionary",
      inheritable: !opts.partial,
      allowedMembers: [
        [Field.parse],
      ]
    });
  }

  get type() {
    return "dictionary";
  }
}
