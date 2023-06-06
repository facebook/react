import { RuleTester as ESLintTester } from "eslint";
import ReactForgetDiagnostics from "../src/rules/ReactForgetDiagnostics";

const tests = {
  valid: [{ code: "" }],
  invalid: [],
};

const eslintTester = new ESLintTester();
eslintTester.run("react-forget-diagnostics", ReactForgetDiagnostics, tests);
