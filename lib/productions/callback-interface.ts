// @ts-check

import { Container } from "./container.ts";
import { Operation } from "./operation.ts";
import { Constant } from "./constant.ts";
import { Tokeniser } from "../tokeniser.ts";
import { TokenDictionary } from "./base.ts";

export class CallbackInterface extends Container {
  
  static parse(tokeniser: Tokeniser, opts:any = { partial: undefined, callback: undefined}): CallbackInterface {
    const { callback, partial } = opts;
    const tokens: TokenDictionary = { callback };
    tokens.base = tokeniser.consume("interface");
    if (!tokens.base) {
      return;
    }
    return Container.parse(tokeniser, new CallbackInterface({ source: tokeniser.source, tokens }), {
      type: "callback interface",
      inheritable: !partial,
      allowedMembers: [
        [Constant.parse],
        [Operation.parse, { regular: true }]
      ]
    });
  }

  get type() {
    return "callback interface";
  }
}
