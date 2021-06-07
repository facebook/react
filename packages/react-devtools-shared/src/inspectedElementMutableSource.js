/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  convertInspectedElementBackendToFrontend,
  hydrateHelper,
  inspectElement as inspectElementAPI,
} from 'react-devtools-shared/src/backendAPI';
import {fillInPath} from 'react-devtools-shared/src/hydration';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {
  InspectElementFullData,
  InspectElementHydratedPath,
} from 'react-devtools-shared/src/backend/types';
import type {
  Element,
  InspectedElement as InspectedElementFrontend,
  InspectedElementResponseType,
} from 'react-devtools-shared/src/devtools/views/Components/types';

// Map an Element in the Store to the most recent copy of its inspected data.
// As updates comes from the backend, inspected data is updated.
// Both this map and the inspected objects in it are mutable.
// They should never be read from directly during render;
// Use a Suspense cache to ensure that transitions work correctly and there is no tearing.
const inspectedElementMap: WeakMap<
  Element,
  InspectedElementFrontend,
> = new WeakMap();

type Path = Array<string | number>;

type InspectElementReturnType = [
  InspectedElementFrontend,
  InspectedElementResponseType,
];

export function inspectElement({
  bridge,
  element,
  path,
  rendererID,
}: {|
  bridge: FrontendBridge,
  element: Element,
  path: Path | null,
  rendererID: number,
|}): Promise<InspectElementReturnType> {
  const {id} = element;
  return inspectElementAPI({
    bridge,
    id,
    path,
    rendererID,
  }).then((data: any) => {
    const {type} = data;

    let inspectedElement;
    switch (type) {
      case 'no-change':
        // This is a no-op for the purposes of our cache.
        inspectedElement = inspectedElementMap.get(element);
        if (inspectedElement != null) {
          return [inspectedElement, type];
        }
        break;

      case 'not-found':
        // This is effectively a no-op.
        // If the Element is still in the Store, we can eagerly remove it from the Map.
        inspectedElementMap.delete(element);

        throw Error(`Element "${id}" not found`);

      case 'full-data':
        const fullData = ((data: any): InspectElementFullData);

        // New data has come in.
        // We should replace the data in our local mutable copy.
        inspectedElement = convertInspectedElementBackendToFrontend(
          fullData.value,
        );

        inspectedElementMap.set(element, inspectedElement);

        return [inspectedElement, type];

      case 'hydrated-path':
        const hydratedPathData = ((data: any): InspectElementHydratedPath);
        const {value} = hydratedPathData;

        // A path has been hydrated.
        // Merge it with the latest copy we have locally and resolve with the merged value.
        inspectedElement = inspectedElementMap.get(element) || null;
        if (inspectedElement !== null) {
          // Clone element
          inspectedElement = {...inspectedElement};

          // Merge hydrated data
          fillInPath(
            inspectedElement,
            value,
            ((path: any): Path),
            hydrateHelper(value, ((path: any): Path)),
          );

          inspectedElementMap.set(element, inspectedElement);

          return [inspectedElement, type];
        }
        break;

      default:
        // Should never happen.
        if (__DEV__) {
          console.error(
            `Unexpected inspected element response data: "${type}"`,
          );
        }
        break;
    }

    throw Error(`Unable to inspect element with id "${id}"`);
  });
}
