import { Token } from "./productions/token.ts";
import { TokeniserToken } from "./tokeniser.ts";
import { Base } from "./productions/base.ts";

/**
 * @param {string} text
 */
function lastLine(text) {
  const splitted = text.split("\n");
  return splitted[splitted.length - 1];
}

export interface WebIDL2ErrorOptions {
  level?: "error" | "warning";
  autofix?: ()=>void;
  ruleName?: string;
}

function error(
  source: TokeniserToken[] = [],
  position: number,
  current: Base,
  message: string,
  kind: "Syntax" | "Validation",
  options:WebIDL2ErrorOptions = { level: "error", autofix: undefined, ruleName: undefined }
) {
  
  function sliceTokens(count: number) {
    return count > 0
      ? source.slice(position, position + count)
      : source.slice(Math.max(position + count, 0), position);
  }

  function tokensToText(inputs: TokeniserToken[], { precedes } = { precedes: undefined }) {
    const text: string = inputs.map(t => t.trivia + t.value).join("");
    const nextToken = source[position];
    if (nextToken?.type === "eof") {
      return text;
    }
    if (precedes) {
      return text + nextToken?.trivia;
    }
    return text.slice(nextToken?.trivia?.length);
  }

  const { level, autofix, ruleName } = options;
  const maxTokens = 5; // arbitrary but works well enough
  const line =
    source[position]?.type !== "eof"
      ? source[position]?.line
      : source.length > 1
      ? source[position - 1]?.line
      : 1;

  const precedingLastLine = lastLine(
    tokensToText(sliceTokens(-maxTokens), { precedes: true })
  );

  const subsequentTokens = sliceTokens(maxTokens);
  const subsequentText = tokensToText(subsequentTokens);
  const subsequentFirstLine = subsequentText.split("\n")[0];

  const spaced = " ".repeat(precedingLastLine.length) + "^";
  const sourceContext = precedingLastLine + subsequentFirstLine + "\n" + spaced;

  const contextType = kind === "Syntax" ? "since" : "inside";
  const inSourceName = (<any>source).name ? ` in ${(<any>source).name}` : "";
  const grammaticalContext =
    current && current.name
      ? `, ${contextType} \`${current.partial ? "partial " : ""}${
          current.type
        } ${current.name}\``
      : "";
  const context = `${kind} error at line ${line}${inSourceName}${grammaticalContext}:\n${sourceContext}`;
  return {
    message: `${context} ${message}`,
    bareMessage: message,
    context,
    line,
    sourceName: (<any>source).name,
    level,
    ruleName,
    autofix,
    input: subsequentText,
    tokens: subsequentTokens
  };
}

/**
 * @param {string} message error message
 */
export function syntaxError(source, position, current, message) {
  return error(source, position, current, message, "Syntax");
}

/**
 * @param {string} message error message
 * @param {WebIDL2ErrorOptions} [options]
 */
export function validationError(
  token: TokeniserToken,
  current: Base,
  ruleName: string,
  message: string,
  options:WebIDL2ErrorOptions = { level: "error", ruleName: undefined, autofix: undefined }
) {
  options.ruleName = ruleName;
  return error(
    current.source,
    token.index,
    current,
    message,
    "Validation",
    options
  );
}
