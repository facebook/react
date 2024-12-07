import {workerRule} from './workerRule';
import {cssRule} from './cssRule';
import { JSrule } from './JSrule';

export function buildRules() {
    return {
        workerRule,
        cssRule,
        JSrule
    }
}