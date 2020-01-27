import { Base, TokenDictionary } from "./base.ts";
import { ArrayBase } from "./array-base.ts";
import { Token } from "./token.ts";
import { list, argument_list, autoParenter, unescape } from "./helpers.ts";
import { validationError } from "../error.ts";
import { Tokeniser } from "../tokeniser.ts";
import { Argument } from "./argument.ts";

function tokens(tokeniser: Tokeniser, tokenName: string) {
  const toks = list(tokeniser, {
    parser: Token.parser(tokeniser, tokenName),
    listName: tokenName + " list"
  });
  return toks;
}

/**
 * This will allow a set of identifiers or strings to be parsed.
 */
function identifiersOrStrings(tokeniser: Tokeniser) {
  let toks = tokens(tokeniser, "identifier");
  if (toks.length) {
    return toks;
  }
  toks = tokens(tokeniser, "string");
  if (toks.length) {
    return toks;
  }
  tokeniser.error(`Expected identifiers or strings but none found`);
}

class ExtendedAttributeParameters extends Base {  
  list: Token[] | Argument[];
  hasRhs: boolean;
  name: string = undefined;

  static parse(tokeniser: Tokeniser) {
    const tokens: TokenDictionary = { assign: tokeniser.consume("=") };
    const ret = autoParenter(
      new ExtendedAttributeParameters({ source: tokeniser.source, tokens })
    );
    if (tokens.assign) {
      tokens.secondaryName = tokeniser.consume(
        "identifier",
        "decimal",
        "integer",
        "string"
      );
    }
    tokens.open = tokeniser.consume("(");
    if (tokens.open) {
      ret.list = ret.rhsIsList
        ? // [Exposed=(Window,Worker)]
          identifiersOrStrings(tokeniser)
        : // [NamedConstructor=Audio(DOMString src)] or [Constructor(DOMString str)]
          argument_list(tokeniser);
      (tokens.close as any) =
        tokeniser.consume(")") ||
        tokeniser.error("Unexpected token in extended attribute argument list");
    } else if (ret.hasRhs && !tokens.secondaryName) {
      tokeniser.error("No right hand side to extended attribute assignment");
    }
    return ret.this;
  }

  get rhsIsList() {
    return this.tokens.assign && !this.tokens.secondaryName;
  }

  get rhsType() {
    if (this.rhsIsList) {
      return this.list[0].tokens.value.type + "-list";
    }
    if (this.tokens.secondaryName) {
      return this.tokens.secondaryName.type;
    }
    return null;
  }

  *validate(defs) {
    for (const arg of this.list) {
      yield* arg.validate(defs);
    }
  }
}

export class SimpleExtendedAttribute extends Base {
  params: ExtendedAttributeParameters;

  static parse(tokeniser: Tokeniser) {
    const name = tokeniser.consume("identifier");
    if (name) {
      return new SimpleExtendedAttribute({
        source: tokeniser.source,
        tokens: { name },
        params: ExtendedAttributeParameters.parse(tokeniser)
      });
    }
  }

  constructor({ source, tokens, params }) {
    super({ source, tokens });
    params.parent = this;
    this.params = params;
  }

  get type() {
    return "extended-attribute";
  }
  get name() {
    return this.tokens.name.value;
  }
  get rhs() {
    const { rhsType: type, tokens, list } = this.params;
    if (!type) {
      return null;
    }
    const value = this.params.rhsIsList
      ? list
      : unescape(tokens.secondaryName.value);
    return { type, value };
  }
  get arguments() {
    const { rhsIsList, list } = this.params;
    if (!list || rhsIsList) {
      return [];
    }
    return list;
  }

  *validate(defs) {
    if (this.name === "NoInterfaceObject") {
      const message = `\`[NoInterfaceObject]\` extended attribute is an \
undesirable feature that may be removed from Web IDL in the future. Refer to the \
[relevant upstream PR](https://github.com/heycam/webidl/pull/609) for more \
information.`;
      yield validationError(
        this.tokens.name,
        this,
        "no-nointerfaceobject",
        message,
        { level: "warning" }
      );
    }
    for (const arg of this.arguments) {
      yield* arg.validate(defs);
    }
  }
}

// Note: we parse something simpler than the official syntax. It's all that ever
// seems to be used
export class ExtendedAttributes<T = SimpleExtendedAttribute> extends ArrayBase<T> {
  static parse(tokeniser: Tokeniser) {
    const tokens: TokenDictionary = {};
    tokens.open = tokeniser.consume("[");
    if (!tokens.open) return new ExtendedAttributes({});
    const ret = new ExtendedAttributes({ source: tokeniser.source, tokens });
    ret.push(
      ...list(tokeniser, {
        parser: SimpleExtendedAttribute.parse,
        listName: "extended attribute"
      })
    );
    (tokens.close as any) =
      tokeniser.consume("]") ||
      tokeniser.error("Unexpected closing token of extended attribute");
    if (!ret.length) {
      tokeniser.error("Found an empty extended attribute");
    }
    if (tokeniser.probe("[")) {
      tokeniser.error(
        "Illegal double extended attribute lists, consider merging them"
      );
    }
    return ret;
  }

  *validate(defs) {
    for (const extAttr of this) {
      yield* (<unknown>extAttr as (SimpleExtendedAttribute | ExtendedAttributeParameters)).validate(defs);
    }
  }
}
