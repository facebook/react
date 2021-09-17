/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import type {ReactNodeList} from 'shared/ReactTypes';
 import type {Destination, NextExecutor} from 'react-server/src/ReactServerStreamConfigNext'
 
 import ReactVersion from 'shared/ReactVersion';
 
 import {
   createRequest,
   startWork,
   startFlowing,
   stopFlowing,
   abort,
 } from 'react-server/src/ReactFizzServer';
 
 import {
   createResponseState,
   createRootFormatContext,
 } from './ReactDOMServerFormatConfig';
 
 type Options = {|
   identifierPrefix?: string,
   namespaceURI?: string,
   progressiveChunkSize?: number,
   onReadyToStream?: () => void,
   onCompleteAll?: () => void,
   onError?: (error: mixed) => void,
 |};
 
 type Controls = {|
   // Cancel any pending I/O and put anything remaining into
   // client rendered mode.
   abort(): void,
 |};
 
 function createRequestImpl(
   children: ReactNodeList,
   destination: Destination,
   options: void | Options,
 ) {
   return createRequest(
     children,
     destination,
     createResponseState(options ? options.identifierPrefix : undefined),
     createRootFormatContext(options ? options.namespaceURI : undefined),
     options ? options.progressiveChunkSize : undefined,
     options ? options.onError : undefined,
     options ? options.onCompleteAll : undefined,
     options ? options.onReadyToStream : undefined,
   );
 }
 
 function pipeToNextExecutor(
   children: ReactNodeList,
   executor: NextExecutor,
   options?: Options,
 ): Controls {
   const destination = {
     exec: executor,
     state: {
       full: false,
       update: () => {},
     }
   }
   const request = createRequestImpl(children, destination, options);
   destination.state.update = () => {
     if (destination.state.full) {
       stopFlowing(request);
     } else {
       startFlowing(request)
     }
   }
   executor(0, destination.state)
   startWork(request);
   return {
     abort() {
       abort(request);
     },
   };
 }
 
 export {pipeToNextExecutor, ReactVersion as version};
 