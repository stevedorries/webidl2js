import { Base, TokenDictionary } from "./base.ts";
import { type_with_extended_attributes, autoParenter } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";
import { Type } from "./type.ts";

export class IterableLike extends Base {
  
  static parse(tokeniser: Tokeniser) {
    const start_position = tokeniser.position;
    const tokens: TokenDictionary = {};
    const ret = autoParenter(new IterableLike({ source: tokeniser.source, tokens }));
    tokens.readonly = tokeniser.consume("readonly");
    if (!tokens.readonly) {
      tokens.async = tokeniser.consume("async");
    }
    tokens.base =
      tokens.readonly ? tokeniser.consume("maplike", "setlike") :
      tokens.async ? tokeniser.consume("iterable") :
      tokeniser.consume("iterable", "maplike", "setlike");
    if (!tokens.base) {
      tokeniser.unconsume(start_position);
      return;
    }

    const { type } = ret;
    const secondTypeRequired = type === "maplike" || ret.async;
    const secondTypeAllowed = secondTypeRequired || type === "iterable";

    (tokens.open as any) = tokeniser.consume("<") || tokeniser.error(`Missing less-than sign \`<\` in ${type} declaration`);
    let first: Type;
    (first as any) = type_with_extended_attributes(tokeniser) || tokeniser.error(`Missing a type argument in ${type} declaration`);
    ret.idlType = [first];
    if (secondTypeAllowed) {
      first.tokens.separator = tokeniser.consume(",");
      if (first.tokens.separator) {
        ret.idlType.push(type_with_extended_attributes(tokeniser));
      }
      else if (secondTypeRequired) {
        tokeniser.error(`Missing second type argument in ${type} declaration`);
      }
    }
    (tokens.close as any) = tokeniser.consume(">") || tokeniser.error(`Missing greater-than sign \`>\` in ${type} declaration`);
    (tokens.termination as any) = tokeniser.consume(";") || tokeniser.error(`Missing semicolon after ${type} declaration`);

    return ret.this;
  }

  get type() {
    return this.tokens.base.value;
  }
  get readonly() {
    return !!this.tokens.readonly;
  }
  get async() {
    return !!this.tokens.async;
  }
}
