import { Base } from "./base.ts";
import { argument_list, autoParenter } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";
import { ExtendedAttributes } from "./extended-attributes.ts";
import { Argument } from "./argument.ts";
import { Token } from "./token.ts";

export class Constructor extends Base {
  arguments: Token[] | Argument[];
  
  

  static parse(tokeniser: Tokeniser) {
    const base = tokeniser.consume("constructor");
    if (!base) {
      return;
    }
    
    const tokens: Base["tokens"] = { base };
    (tokens.open as any) = tokeniser.consume("(") || tokeniser.error("No argument list in constructor");
    const args = argument_list(tokeniser);
    (tokens.close as any) = tokeniser.consume(")") || tokeniser.error("Unterminated constructor");
    (tokens.termination as any) = tokeniser.consume(";") || tokeniser.error("No semicolon after constructor");
    const ret = new Constructor({ source: tokeniser.source, tokens });
    autoParenter(ret).arguments = args;
    return ret;
  }

  get type() {
    return "constructor";
  }

  *validate(defs) {
    if (this.idlType) {
      yield* this.idlType.validate(defs);
    }
    for (const argument of this.arguments) {
      yield* argument.validate(defs);
    }
  }
}
