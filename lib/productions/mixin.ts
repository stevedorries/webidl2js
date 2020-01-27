import { Container } from "./container.ts";
import { Constant } from "./constant.ts";
import { Attribute } from "./attribute.ts";
import { Operation } from "./operation.ts";
import { stringifier } from "./helpers.ts";
import { Tokeniser, TokeniserToken } from "../tokeniser.ts";
import { TokenDictionary } from "./base.ts";

export class Mixin extends Container {
  
  static parse(tokeniser: Tokeniser, opts: any = {base: undefined, partial: undefined}): Mixin {
    const { base, partial } = opts;
    const tokens: TokenDictionary = { partial, base };
    tokens.mixin = tokeniser.consume("mixin");
    if (!tokens.mixin) {
      return;
    }
    return Container.parse(tokeniser, new Mixin({ source: tokeniser.source, tokens }), {
      type: "interface mixin",
      allowedMembers: [
        [Constant.parse],
        [stringifier],
        [Attribute.parse, { noInherit: true }],
        [Operation.parse, { regular: true }]
      ]
    });
  }

  get type() {
    return "interface mixin";
  }
}
