import { Base, TokenDictionary } from "./base.ts";
import { Default } from "./default.ts";
import { ExtendedAttributes } from "./extended-attributes.ts";
import {
  unescape,
  type_with_extended_attributes,
  autoParenter,
  getFirstToken
} from "./helpers.ts";
import { argumentNameKeywords, Tokeniser } from "../tokeniser.ts";
import { validationError } from "../error.ts";
import {
  idlTypeIncludesDictionary,
  dictionaryIncludesRequiredField
} from "../validators/helpers.ts";
import { Type } from "./type.ts";
import { Definitions } from "../validator.ts";

export class Argument extends Base {
  idlType: Type = undefined;
  default: Default;
  extAttrs: ExtendedAttributes;

  static parse(tokeniser: Tokeniser): Argument {
    const start_position = tokeniser.position;
    const tokens: TokenDictionary = {};
    const ret = autoParenter(
      new Argument({ source: tokeniser.source, tokens })
    );
    ret.extAttrs = ExtendedAttributes.parse(tokeniser);
    tokens.optional = tokeniser.consume("optional");
    ret.idlType = type_with_extended_attributes(tokeniser, "argument-type");
    if (!ret.idlType) {
      tokeniser.unconsume(start_position);
      return undefined;
    }
    if (!tokens.optional) {
      tokens.variadic = tokeniser.consume("...");
    }
    tokens.name = tokeniser.consume("identifier", ...argumentNameKeywords);
    if (!tokens.name) {
      tokeniser.unconsume(start_position);
      return undefined;
    }
    ret.default = tokens.optional ? Default.parse(tokeniser) : null;
    return ret.this;
  }

  get type() {
    return "argument";
  }
  get optional() {
    return !!this.tokens.optional;
  }
  get variadic() {
    return !!this.tokens.variadic;
  }
  get name() {
    return unescape(this.tokens.name.value);
  }

  *validate(defs: Definitions) {
    yield* this.idlType.validate(defs);
    const result = idlTypeIncludesDictionary(this.idlType, defs, {
      useNullableInner: true
    });
    if (result) {
      if (this.idlType.nullable) {
        const message = `Dictionary arguments cannot be nullable.`;
        yield validationError(
          this.tokens.name,
          this,
          "no-nullable-dict-arg",
          message
        );
      } else if (!this.optional) {
        if (
          this.parent &&
          !dictionaryIncludesRequiredField(result.dictionary, defs) &&
          isLastRequiredArgument(this)
        ) {
          const message = `Dictionary argument must be optional if it has no required fields`;
          yield validationError(
            this.tokens.name,
            this,
            "dict-arg-optional",
            message,
            {
              level: "error",
              autofix: autofixDictionaryArgumentOptionality(this)
            }
          );
        }
      } else if (!this.default) {
        const message = `Optional dictionary arguments must have a default value of \`{}\`.`;
        yield validationError(
          this.tokens.name,
          this,
          "dict-arg-default",
          message,
          {
            level: "error",
            autofix: autofixOptionalDictionaryDefaultValue(this)
          }
        );
      }
    }
  }
}

function isLastRequiredArgument(arg: Argument) {
  const list = arg.parent.arguments || arg.parent.list;
  const index = list.indexOf(arg);
  const requiredExists = list.slice(index + 1).some(a => !a.optional);
  return !requiredExists;
}

function autofixDictionaryArgumentOptionality(arg: Argument) {
  return () => {
    const firstToken = getFirstToken(arg.idlType);
    arg.tokens.optional = {
      type: "optional",
      value: "optional",
      trivia: firstToken.trivia
    };
    firstToken.trivia = " ";
    autofixOptionalDictionaryDefaultValue(arg)();
  };
}

function autofixOptionalDictionaryDefaultValue(arg: Argument) {
  return () => {
    arg.default = Default.parse(new Tokeniser(" = {}"));
  };
}
