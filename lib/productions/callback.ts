import { Base, TokenDictionary } from "./base.ts";
import { return_type, argument_list, unescape, autoParenter } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";
import { Argument } from "./argument.ts";
import { Token } from "./token.ts";

export class CallbackFunction extends Base {
  arguments: Token[] | Argument[];

  static parse(tokeniser: Tokeniser, base): CallbackFunction {
    const tokens: TokenDictionary = { base };
    const ret = autoParenter(new CallbackFunction({ source: tokeniser.source, tokens }));
    tokens.name = tokeniser.consume("identifier") || tokeniser.error("Callback lacks a name") as any;
    tokeniser.current = ret.this;
    tokens.assign = tokeniser.consume("=") || tokeniser.error("Callback lacks an assignment") as any;
    ret.idlType = return_type(tokeniser) || tokeniser.error("Callback lacks a return type");
    tokens.open = tokeniser.consume("(") || tokeniser.error("Callback lacks parentheses for arguments") as any;
    ret.arguments = argument_list(tokeniser);
    tokens.close = tokeniser.consume(")") || tokeniser.error("Unterminated callback") as any;
    tokens.termination = tokeniser.consume(";") || tokeniser.error("Unterminated callback, expected `;`") as any;
    return ret.this;
  }

  get type() {
    return "callback";
  }
  get name() {
    return unescape(this.tokens.name.value);
  }

  *validate(defs) {
    yield* this.idlType.validate(defs);
  }
}
