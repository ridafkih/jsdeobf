import parseScript from "shift-parser";
import * as Shift from "shift-ast";
import codegen, { FormattedCodeGen } from "shift-codegen";
import Modification from "./modification";
import ProxyRemover from "./modifications/proxies/proxyRemover";
import ExpressionSimplifier from "./modifications/expressions/expressionSimplifier";
import ArrayUnpacker from "./modifications/arrays/arrayUnpacker";
import PropertySimplifier from "./modifications/properties/propertySimplifier";
import CleanupHelper from "./helpers/cleanupHelper";
import VariableRenamer from "./modifications/renaming/variableRenamer";
import FunctionExecutor from "./modifications/execution/functionExecutor";
import { Config } from "./config";

export function deobfuscate(source: string, config: Config = {}): string {
  const ast = parseScript(source) as Shift.Script;
  const modifications: Modification[] = [];

  modifications.push(new FunctionExecutor(ast));

  if (config.replaceProxyFunctions) {
    modifications.push(
      new ProxyRemover(ast, config.removeProxyFunctions || false)
    );
  }

  if (config.simplifyExpressions) {
    modifications.push(new ExpressionSimplifier(ast));
  }

  if (config.unpackArrays) {
    modifications.push(new ArrayUnpacker(ast, config.removeArrays || false));
  }

  if (config.simplifyExpressions) {
    modifications.push(new ExpressionSimplifier(ast));
  }

  if (config.simplifyProperties) {
    modifications.push(new PropertySimplifier(ast));
  }

  if (config.renameHexIdentifiers) {
    modifications.push(new VariableRenamer(ast));
  }

  for (const modification of modifications) {
    modification.execute();
  }

  CleanupHelper.cleanup(ast);
  const output = config.beautify
    ? codegen(ast, new FormattedCodeGen())
    : codegen(ast);

  return output;
}
