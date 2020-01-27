import { Base } from "./base.ts";
import { const_data, const_value } from "./helpers.ts";
import { Tokeniser, TokeniserToken } from "../tokeniser.ts";

export class Default extends Base {
  static parse(tokeniser: Tokeniser) {
    const assign = tokeniser.consume("=");
    if (!assign) {
      return null;
    }
    let def: TokeniserToken;
    let close: TokeniserToken;
    (def as any) =
      const_value(tokeniser) ||
      tokeniser.consume("string", "null", "[", "{") ||
      tokeniser.error("No value for default");
    const expression = [def];
    if (def.type === "[") {
      (close as any) =
        tokeniser.consume("]") ||
        tokeniser.error("Default sequence value must be empty");
      expression.push(close);
    } else if (def.type === "{") {
      (close as any) =
        tokeniser.consume("}") ||
        tokeniser.error("Default dictionary value must be empty");
      expression.push(close);
    }
    return new Default({
      source: tokeniser.source,
      tokens: { assign },
      expression
    });
  }

  expression: TokeniserToken[];

  constructor({ source, tokens, expression }) {
    super({ source, tokens });
    expression.parent = this;
    this.expression = expression;
  }

  get type() {
    return const_data(this.expression[0]).type;
  }
  get value() {
    return const_data(this.expression[0]).value;
  }
  get negative() {
    return const_data(this.expression[0]).negative;
  }
}
