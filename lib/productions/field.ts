import { Base, TokenDictionary } from "./base.ts";
import { unescape, type_with_extended_attributes, autoParenter } from "./helpers.ts";
import { ExtendedAttributes } from "./extended-attributes.ts";
import { Default } from "./default.ts";
import { Tokeniser } from "../tokeniser.ts";

export class Field extends Base {
  
  default?: Default;

  static parse(tokeniser: Tokeniser) {
  
    const tokens: TokenDictionary = {};
    const ret = autoParenter(new Field({ source: tokeniser.source, tokens }));
    ret.extAttrs = ExtendedAttributes.parse(tokeniser);
    tokens.required = tokeniser.consume("required");
    ret.idlType = type_with_extended_attributes(tokeniser, "dictionary-type") || tokeniser.error("Dictionary member lacks a type");
    (tokens.name as any) = tokeniser.consume("identifier") || tokeniser.error("Dictionary member lacks a name");
    ret.default = Default.parse(tokeniser);
    if (tokens.required && ret.default) tokeniser.error("Required member must not have a default");
    (tokens.termination as any) = tokeniser.consume(";") || tokeniser.error("Unterminated dictionary member, expected `;`");
    return ret.this;
  }

  get type() {
    return "field";
  }
  get name() {
    return unescape(this.tokens.name.value);
  }
  get required() {
    return !!this.tokens.required;
  }

  *validate(defs) {
    yield* this.idlType.validate(defs);
  }
}
