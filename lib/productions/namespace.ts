import { Container } from "./container.ts";
import { Attribute } from "./attribute.ts";
import { Operation } from "./operation.ts";
import { validationError } from "../error.ts";
import { autofixAddExposedWindow } from "./helpers.ts";
import { Tokeniser, TokeniserToken } from "../tokeniser.ts";
import { Base, TokenDictionary } from "./base.ts";

export class Namespace extends Container{
  
  static parse(tokeniser: Tokeniser, opts: any = { partial: undefined}): Namespace {
    const tokens: TokenDictionary = { partial: opts.partial };
    tokens.base = tokeniser.consume("namespace");
    if (!tokens.base) {
      return;
    }
    return Container.parse(tokeniser, new Namespace({ source: tokeniser.source, tokens }), {
      type: "namespace",
      allowedMembers: [
        [Attribute.parse, { noInherit: true, readonly: true }],
        [Operation.parse, { regular: true }]
      ]
    });
  }

  get type() {
    return "namespace";
  }

  *validate(defs) {
    if (!this.partial && this.extAttrs.every(extAttr => extAttr.name !== "Exposed")) {
      const message = `Namespaces must have [Exposed] extended attribute. \
To fix, add, for example, [Exposed=Window]. Please also consider carefully \
if your namespace should also be exposed in a Worker scope. Refer to the \
[WebIDL spec section on Exposed](https://heycam.github.io/webidl/#Exposed) \
for more information.`;
      yield validationError(this.tokens.name, this, "require-exposed", message, {
        autofix: autofixAddExposedWindow(this)
      });
    }
    yield* super.validate(defs);
  }
}
