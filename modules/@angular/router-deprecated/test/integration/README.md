# Router integration tests

These tests only mock out `Location`, and otherwise use all the real parts of routing to ensure that
various routing scenarios work as expected.

The Component Router in Angular 2 exposes only a handful of different options, but because they can
be combined and nested in so many ways, it's difficult to rigorously test all the cases.

The address this problem, we introduce `describeRouter`, `describeWith`, and `describeWithout`.