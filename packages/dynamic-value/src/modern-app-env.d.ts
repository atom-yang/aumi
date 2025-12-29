/// <reference types="@modern-js/module-tools/types" />

declare module 'json-logic-js' {
  interface JsonLogic {
    apply: (logic: Record<string, unknown>, data: unknown) => unknown;
    add_operation: (name: string, fn: (...args: unknown[]) => unknown) => void;
  }
  const jsonLogic: JsonLogic;
  export default jsonLogic;
}
