// @inferEffectDependencies
import {useSpecialEffect} from 'react';
import {print} from 'shared-runtime';

function CustomConfig({propVal}) {
  // Insertion
  useSpecialEffect(() => print(propVal), [propVal]);
  // No insertion
  useSpecialEffect(() => print(propVal), [propVal], [propVal]);
}
