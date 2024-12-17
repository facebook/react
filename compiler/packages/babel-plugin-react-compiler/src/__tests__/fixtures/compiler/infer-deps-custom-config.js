// @inferEffectDependencies
import {print, useSpecialEffect} from 'shared-runtime';

function CustomConfig({propVal}) {
  // Insertion
  useSpecialEffect(() => print(propVal), [propVal]);
  // No insertion
  useSpecialEffect(() => print(propVal), [propVal], [propVal]);
}
