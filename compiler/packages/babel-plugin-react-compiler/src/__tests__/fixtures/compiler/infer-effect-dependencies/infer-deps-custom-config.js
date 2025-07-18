// @inferEffectDependencies
import {print, useSpecialEffect} from 'shared-runtime';
import {AUTODEPS} from 'react';

function CustomConfig({propVal}) {
  // Insertion
  useSpecialEffect(() => print(propVal), [propVal], AUTODEPS);
  // No insertion
  useSpecialEffect(() => print(propVal), [propVal], [propVal]);
}
