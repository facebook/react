# The Mutability & Aliasing Model

This document describes the new (as of June 2025) mutability and aliasing model powering React Compiler. The mutability and aliasing system is a conceptual subcomponent whose primary role is to determine minimal sets of values that mutate together, and the range of instructions over which those mutations occur. These minimal sets of values that mutate together, and the corresponding instructions doing those mutations, are ultimately grouped into reactive scopes, which then translate into memoization blocks in the output (after substantial additional processing described in the comments of those passes).

To build an intuition, consider the following example:

```js
function Component() {
    // a is created and mutated over the course of these two instructions:
    const a = {};
    mutate(a);

    // b and c are created and mutated together — mutate might modify b via c
    const b = {};
    const c = {b};
    mutate(c);

    // does not modify a/b/c
    return <Foo a={a} c={c} />
}
```

The goal of mutability and aliasing inference is to understand the set of instructions that create/modify a, b, and c.

In code, the mutability and aliasing model is compromised of the following. More details about each pass follow below.

* `InferMutationAliasingEffects`. Infers a set of mutation and aliasing effects for each instruction.
* `InferMutationAliasingRanges`. Infers a mutable range (start:end instruction ids) for each value in the program, and annotates each Place with its effect type for usage in later passes.
* `InferReactiveScopeVariables`. Given the per-Place effects, determines disjoint sets of values that mutate together and assigns all identifiers in each set to a unique scope, and updates the range to include the ranges of all constituent values.

Finally, `AnalyzeFunctions` needs to understand the mutation and aliasing semantics of nested FunctionExpression and ObjectMethod values. `AnalyzeFunctions` calls `InferFunctionExpressionAliasingEffectsSignature` to determine the publicly observable set of mutation/aliasing effects for nested functions.

## Mutation and Aliasing Effects

The inference model is based on a set of "effects" that describe subtle aspects of mutation, aliasing, and other changes to the state of values over time

### Creation Effects

#### Create

```js
{
    kind: 'Create';
    into: Place;
    value: ValueKind;
    reason: ValueReason;
}
```

Describes the creation of a new value with the given kind, and reason for having that kind. For example, `x = 10` might have an effect like `Create x = ValueKind.Primitive [ValueReason.Other]`.

#### CreateFunction

```js
{
    kind: 'CreateFunction';
    captures: Array<Place>;
    function: FunctionExpression | ObjectMethod;
    into: Place;
}
```

Describes the creation of new function value, capturing the given set of mutable values. CreateFunction is used to specifically track function types so that we can precisely model calls to those functions with `Apply`.

#### Apply

```js
{
    kind: 'Apply';
    receiver: Place;
    function: Place; // same as receiver for function calls
    mutatesFunction: boolean; // indicates if this is a type that we consdier to mutate the function itself by default
    args: Array<Place | SpreadPattern | Hole>;
    into: Place; // where result is stored
    signature: FunctionSignature | null;
}
```

Describes the potential creation of a value by calling a function. This models `new`, function calls, and method calls. The inference algorithm uses the most precise signature it can determine:

* If the function is a locally created function expression, we use a signature inferred from the behavior of that function to interpret the effects of calling it with the given arguments.
* Else if the function has a known aliasing signature (new style precise effects signature), we apply the arguments to that signature to get a precise set of effects.
* Else if the function has a legacy style signature (with per-param effects) we convert the legacy per-Place effects into aliasing effects (described in this doc) and apply those.
* Else fall back to inferring a generic set of effects.

The generic fallback is to assume:
- The return value may alias any of the arguments (Alias param -> return)
- Any arguments *may* be transitively mutated (MutateTransitiveConditionally param)
- Any argument may be captured into any other argument (Capture paramN -> paramM for all N,M where N != M)

### Aliasing Effects

These effects describe data-flow only, separately from mutation or other state-changing semantics.

#### Assign

```js
{
    kind: 'Assign';
    from: Place;
    into: Place;
}
```

Describes an `x = y` assignment, where the receiving (into) value is overwritten with a new (from) value. After this effect, any previous assignments/aliases to the receiving value are dropped. Note that `Alias` initializes the receiving value.

> TODO: InferMutationAliasingRanges may not fully reset aliases on encountering this effect

#### Alias

```js
{
    kind: 'Alias';
    from: Place;
    into: Place;
}
```

Describes that an assignment _may_ occur, but that the possible assignment is non-exclusive. The canonical use-case for `Alias` is a function that may return more than one of its arguments, such as `(x, y, z) => x ? y : z`. Here, the result of this function may be `y` or `z`, but neither one overwrites the other. Note that `Alias` does _not_ initialize the receiving value: it should always be paired with an effect to create the receiving value.

#### Capture

```js
{
    kind: 'Capture';
    from: Place;
    into: Place;
}
```

Describes that a reference to one variable (from) is stored within another value (into). Examples include:
- An array expression captures the items of the array (`array = [capturedValue]`)
- Array.prototype.push captures the pushed values into the array (`array.push(capturedValue)`)
- Property assignment captures the value onto the object (`object.property = capturedValue`)

#### CreateFrom

```js
{
    kind: 'CreateFrom';
    from: Place;
    into: Place;
}
```

This is somewhat the inverse of `Capture`. The `CreateFrom` effect describes that a variable is initialized by extracting _part_ of another value, without taking a direct alias to the full other value. Examples include:

- Indexing into an array (`createdFrom = array[0]`)
- Reading an object property (`createdFrom = object.property`)
- Getting a Map key (`createdFrom = map.get(key)`)

#### ImmutableCapture

Describes immutable data flow from one value to another. This is not currently used for anything, but is intended to eventually power a more sophisticated escape analysis.

### State-Changing Effects

The following effects describe state changes to specific values, not data flow. In many cases, JavaScript semantics will involve a combination of both data-flow effects *and* state-change effects. For example, `object.property = value` has data flow (`Capture object <- value`) and mutation (`Mutate object`).

#### Freeze

```js
{
    kind: 'Freeze',
    // The reference being frozen
    value: Place;
    // The reason the value is frozen (passed to a hook, passed to jsx, etc)
    reason: ValueReason;
}
```

Once a reference to a value has been passed to React, that value is generally not safe to mutate further. This is not a strictly required property of React, but is a natural consequence of making components and hooks composable without leaking implementation details. Concretely, once a value has been passed as a JSX prop, passed as argument to a hook, or returned from a hook, it must be assumed that the other "side" — receiver of the prop/argument/return value — will use that value as an input to an effect or memoization unit. Mutating that value (instead of creating a new value) will fail to cause the consuming computation to update:

```js
// INVALID DO NOT DO THIS
function Component(props) {
    const array = useArray(props.value);
    // OOPS! this value is memoized, the array won't get re-created
    // when `props.value` changes, so we might just keep pushing new
    // values to the same array on every render!
    array.push(props.otherValue);
}

function useArray(a) {
    return useMemo(() => [a], [a]);
}
```

The **Freeze** effect accepts a variable reference and a reason that the value is being frozen. Note: _freeze only applies to the reference, not the underlying value_. Our inference is conservative, and assumes that there may still be other references to the same underlying value which are mutated later. For example:

```js
const x = {};
const y = [];
x.y = y;
freeze(y); // y _reference_ is frozen
x.y.push(props.value); // but y is still considered mutable bc of this
```

#### Mutate

```js
{
    kind: 'Mutate';
    value: Place;
}
```

Mutate indicates that a value is mutated, without modifying any of the values that it may transitively have captured. Canonical examples include:

- Pushing an item onto an array modifies the array, but does not modify any items stored _within_ the array (unless the array has a reference to itself!)
- Assigning a value to an object property modifies the object, but not any values stored in the object's other properties.

This helps explain the distinction between Assign/Alias and Capture: Mutate only affects assign/alias but not captures.


## Rules

### Mutation of Alias Mutates the Source Value

```
Alias a <- b
Mutate a
=>
Mutate b
```

Example:

```js
const a = maybeIdentity(b); // Alias a <- b
a.property = value; // a could be b, so this mutates b
```

### Mutation of Assignment Mutates the Source Value

```
Assign a <- b
Mutate a
=>
Mutate b
```

Example:

```js
const a = b;
a.property = value // a _is_ b, this mutates b
```

### Mutation of CreateFrom Mutated the Source Value

```
CreateFrom a <- b
Mutate A
=>
MutateTransitive b
```

Example:

```js
const a = array[index];
a.property = value // the contents of a are transitively mutated
```


### Mutation of Capture Does *Not* Mutate the Source Value

```
Capture a <- b
Mutate a
=x
~Mutate b~
```

### TransitiveMutation of Alias, Assignment, CreateFrom, or Capture Mutates the Source

```
Alias a <- b OR Assign a <- b OR CreateFrom a <- b OR Capture a <- b
MutateTransitive a
=>
MutateTransitive b
```

