import * as estree from 'estree';
import { Rule, ESLint } from 'eslint';

declare const rules: {
    'exhaustive-deps': {
        meta: {
            type: "suggestion";
            docs: {
                description: string;
                recommended: true;
                url: string;
            };
            fixable: "code";
            hasSuggestions: true;
            schema: {
                type: "object";
                additionalProperties: false;
                enableDangerousAutofixThisMayCauseInfiniteLoops: boolean;
                properties: {
                    additionalHooks: {
                        type: "string";
                    };
                    enableDangerousAutofixThisMayCauseInfiniteLoops: {
                        type: "boolean";
                    };
                    experimental_autoDependenciesHooks: {
                        type: "array";
                        items: {
                            type: "string";
                        };
                    };
                    requireExplicitEffectDeps: {
                        type: "boolean";
                    };
                };
            }[];
        };
        create(context: Rule.RuleContext): {
            CallExpression: (node: estree.CallExpression) => void;
        };
    };
    'react-compiler': Rule.RuleModule;
    'rules-of-hooks': {
        meta: {
            type: "problem";
            docs: {
                description: string;
                recommended: true;
                url: string;
            };
        };
        create(context: Rule.RuleContext): {
            '*'(node: any): void;
            '*:exit'(node: any): void;
            CallExpression(node: estree.CallExpression & Rule.NodeParentExtension): void;
            Identifier(node: estree.Identifier & Rule.NodeParentExtension): void;
            'CallExpression:exit'(node: estree.CallExpression & Rule.NodeParentExtension): void;
            FunctionDeclaration(node: estree.FunctionDeclaration & Rule.NodeParentExtension): void;
            ArrowFunctionExpression(node: estree.ArrowFunctionExpression & Rule.NodeParentExtension): void;
        };
    };
};
declare const configs: {
    'recommended-legacy': {
        plugins: string[];
        rules: {
            'react-hooks/rules-of-hooks': "error";
            'react-hooks/exhaustive-deps': "warn";
        };
    };
    recommended: {
        name: string;
        plugins: {
            readonly 'react-hooks': ESLint.Plugin;
        };
        rules: {
            'react-hooks/rules-of-hooks': "error";
            'react-hooks/exhaustive-deps': "warn";
        };
    };
    'recommended-latest': {
        name: string;
        plugins: {
            readonly 'react-hooks': ESLint.Plugin;
        };
        rules: {
            'react-hooks/rules-of-hooks': "error";
            'react-hooks/exhaustive-deps': "warn";
        };
    };
};
declare const meta: {
    name: string;
};

export { configs, meta, rules };
