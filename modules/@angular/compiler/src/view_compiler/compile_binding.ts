import {TemplateAst} from '../template_ast';

import {CompileNode} from './compile_element';

export class CompileBinding {
  constructor(public node: CompileNode, public sourceAst: TemplateAst) {}
}
