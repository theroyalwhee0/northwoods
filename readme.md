# Northwoods, A lightweight Bunyan-like browser logging library
'Northwoods' is a Javascript logging library with a [Bunyan-like](https://github.com/trentm/node-bunyan) API. It has no dependencies.

# Installation
npm --save install @theroyalwhee0/northwoods

# Documentation
There is no documentation yet. Getting familiar with [Bunyan's API](https://github.com/trentm/node-bunyan#introduction) should help using Northwoods' API.

# Usage
```
var log = new Northwoods.Logger({ name: 'flapjacks' });
log.info({ maple: true, butter: true }, 'Here comes the syrup.');
```
The [tests](https://github.com/theroyalwhee0/northwoods/tree/master/test) can be used as examples as well.

# Testing
- npm test
- npm run test-watch

# Legal & License
Copyright 2016 Adam Mill

The library is released under Apache 2 license.  See LICENSE for more details.
