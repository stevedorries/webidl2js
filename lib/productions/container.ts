import { Base } from "./base.ts";
import { ExtendedAttributes } from "./extended-attributes.ts";
import { unescape, autoParenter } from "./helpers.ts";
import { Tokeniser } from "../tokeniser.ts";

function inheritance(tokeniser: Tokeniser) {
  const colon = tokeniser.consume(":");
  if (!colon) {
    return {};
  }
  const inheritance = tokeniser.consume("identifier") || tokeniser.error("Inheritance lacks a type");
  return { colon, inheritance };
}

export class Container extends Base {
  extAttrs: ExtendedAttributes;
  members: any[];

    protected static parse<T extends Container>(tokeniser: Tokeniser, instance?: T, opts?: {type: string, inheritable?: boolean, allowedMembers: any[][]}): any {
      const { tokens } = instance;
      const { type, inheritable, allowedMembers } = opts;
      (tokens.name as any) = tokeniser.consume("identifier") || tokeniser.error(`Missing name in ${instance.type}`);
      tokeniser.current = instance;
      instance = autoParenter(instance);
      if (inheritable) {
        Object.assign(tokens, inheritance(tokeniser));
      }
      (tokens.open as any) = tokeniser.consume("{") || tokeniser.error(`Bodyless ${type}`);
      instance.members = [];
      while (true) {
        tokens.close = tokeniser.consume("}");
        if (tokens.close) {
          (tokens.termination as any) = tokeniser.consume(";") || tokeniser.error(`Missing semicolon after ${type}`);
          return instance.this;
        }
        const ea = ExtendedAttributes.parse(tokeniser);
        let mem: { extAttrs: ExtendedAttributes; this: any; };
        for (const [parser, ...args] of allowedMembers) {
          mem = autoParenter(parser(tokeniser, ...args));
          if (mem) {
            break;
          }
        }
        if (!mem) {
          tokeniser.error("Unknown member");
        }
        mem.extAttrs = ea;
        instance.members.push(mem.this);
      }
    }

    get partial() {
      return !!this.tokens.partial;
    }
    get name() {
      return unescape(this.tokens.name.value);
    }
    get inheritance() {
      if (!this.tokens.inheritance) {
        return null;
      }
      return unescape(this.tokens.inheritance.value);
    }

    *validate(defs) {
      for (const member of this.members) {
        if (member.validate) {
          yield* member.validate(defs);
        }
      }
    }
  }
