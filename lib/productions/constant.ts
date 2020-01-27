import { Base, TokenDictionary } from "./base.ts";
import { Type } from "./type.ts";
import { const_data, const_value, primitive_type, autoParenter, unescape } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";

export class Constant extends Base {

  static parse(tokeniser: Tokeniser) {
    
    const tokens: TokenDictionary = {};
    tokens.base = tokeniser.consume("const");
    if (!tokens.base) {
      return;
    }
    let idlType = primitive_type(tokeniser);
    if (!idlType) {
      const base = tokeniser.consume("identifier") || tokeniser.error("Const lacks a type");
      idlType = new Type({ source: tokeniser.source, tokens: { base } });
    }
    if (tokeniser.probe("?")) {
      tokeniser.error("Unexpected nullable constant type");
    }
    idlType.type = "const-type";
    tokens.name = tokeniser.consume("identifier") || tokeniser.error("Const lacks a name") as any;
    tokens.assign = tokeniser.consume("=") || tokeniser.error("Const lacks value assignment") as any;
    tokens.value = const_value(tokeniser) || tokeniser.error("Const lacks a value") as any;
    tokens.termination = tokeniser.consume(";") || tokeniser.error("Unterminated const, expected `;`") as any;
    const ret = new Constant({ source: tokeniser.source, tokens });
    autoParenter(ret).idlType = idlType;
    return ret;
  }

  get type() {
    return "const";
  }
  get name() {
    return unescape(this.tokens.name.value);
  }
  get value() {
    return const_data(this.tokens.value);
  }
}
