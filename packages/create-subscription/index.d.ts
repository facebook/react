/**
 * @module typedefinition for package create-subscription introduced in react v16.3
 * https://github.com/facebook/react/tree/master/packages/create-subscription
 */
import {ComponentClass, ReactNode} from "react"

declare module "create-subscription"
{
    type CreateSubscriptionArgs<TSource=any,TValue=any>={
        /**
         * allows to retrieve current value of observable, that apparently will be used to render immediately
         * 
         * @param {TSource} source 
         * @returns {TValue} 
         */
        getCurrentValue(source:TSource):TValue,
        /**
         * Subscribe (e.g. add an event listener) to the subscription (source).
         * Call callback(newValue) whenever a subscription changes.
         * Return an unsubscribe method,
         * Or a no-op if unsubscribe is not supported (e.g. native Promises).
         * 
         * @param {any} source 
         * @param {any} callback 
         */
        subscribe(source:TSource, callback:(newValue:TValue)=>void):()=>void 
    }


    export type SubscriptionComponentClass<TSource=any,TValue=any> = ComponentClass<{source:TSource,children:(value?:TValue)=>ReactNode}>

    /**
     * creates React Component class, allowing to subscribe to any event source
     * @param args getCurrentValue and subscribe methods
     */
    export function createSubscription<TSource=any,TValue=any>(args:CreateSubscriptionArgs<TSource,TValue>):SubscriptionComponentClass<TSource,TValue>;
}

