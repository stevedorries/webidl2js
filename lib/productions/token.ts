// @ts-check

import { Base } from "./base.ts";
import { unescape } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";

export class Token extends Base {
 
  trivia?: string = "";
  name?: string = "";
  line?: number;

  static parser(tokeniser: Tokeniser, type: string) {
    return () => {
      const value = tokeniser.consume(type);
      if (value) {
        return new Token({ source: tokeniser.source, tokens: { value } });
      }
    };
  }

  get value(): string {
    return unescape(this.tokens.value.value);
  }

  *validate(defs) {
    yield true;
  }
}
