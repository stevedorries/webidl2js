import { Base } from "./base.ts";
import { type_with_extended_attributes, unescape, autoParenter } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";
import { Type } from "./type.ts";

export class Typedef extends Base {
  idlType: Type;

  static parse(tokeniser: Tokeniser) {
    const tokens: any = {};
    const ret = autoParenter(new Typedef({ source: tokeniser.source, tokens }));
    tokens.base = tokeniser.consume("typedef");
    if (!tokens.base) {
      return;
    }
    ret.idlType = type_with_extended_attributes(tokeniser, "typedef-type") || <Type>(tokeniser.error("Typedef lacks a type") as unknown);
    tokens.name = tokeniser.consume("identifier") || tokeniser.error("Typedef lacks a name");
    tokeniser.current = ret.this;
    tokens.termination = tokeniser.consume(";") || tokeniser.error("Unterminated typedef, expected `;`");
    return ret.this;
  }

  get type() {
    return "typedef";
  }
  get name() {
    return unescape(this.tokens.name.value);
  }

  *validate(defs) {
    yield* this.idlType.validate(defs);
  }
}
