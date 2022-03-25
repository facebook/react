/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

 import * as React from 'react';
 import styles from './shared.css';
 
 type Props = {|
   callStack: string | null,
   children: React$Node,
   componentStack: string | null,
   errorMessage: string | null,
 |};
 
 export default function UnsupportedBridgeOperationView({
   callStack,
   children,
   componentStack,
   errorMessage,
 }: Props) {
   return (
     <div className={styles.ErrorBoundary}>
       {children}
       <div className={styles.ErrorInfo}>
         <div className={styles.HeaderRow}>
           <div className={styles.ErrorHeader}>
             {errorMessage || 'Error occured in inspected element'}
           </div>
         </div>
         <div className={styles.InfoBox}>
           This is likely to be caused by implementation of current inspected element.
         </div>
         {!!callStack && (
           <div className={styles.ErrorStack}>
             The error was thrown {callStack.trim()}
           </div>
         )}
       </div>
     </div>
   );
 }
 