import * as estree from 'estree';
import { Rule } from 'eslint';

declare const plugin: {
    meta: {
        name: string;
    };
    configs: {};
    rules: {
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
};

export { plugin as default };
