# This project is not longer maintained.
----

## Northwoods: a lightweight Bunyan-like browser logging library.
Northwoods is a Javascript logging library with a [Bunyan-like](https://github.com/trentm/node-bunyan) API. It has no dependencies.

## Installation
npm --save install @theroyalwhee0/northwoods @theroyalwhee0/northwoods-consoleformatted

## Documentation
There is no documentation yet. Getting familiar with [Bunyan's API](https://github.com/trentm/node-bunyan#introduction) should help using Northwoods' API.

## Usage
```
Northwoods.setDefaultStreamType(require('northwoods-consoleformatted'));
var log = new Northwoods.Logger({ name: 'flapjacks' });
log.info({ maple: true, butter: true }, 'Here comes the syrup.');
```
The [tests](https://github.com/theroyalwhee0/northwoods/tree/master/test) can be used as examples as well.

## Testing
- npm test
- npm run test-watch

## History
- v0.0.5 EOL. Same as v0.0.4.
- v0.0.4 Break log formatters out into separate projects. Add log.level(). Add Yarn lock file.
- v0.0.3 Fix bug where log level was being ignored during write.
- v0.0.2 Bug fixes. Unstable.
- v0.0.1 Initial release. Work in progress.

## Legal & License
Copyright 2016-2021 Adam Mill

The library is released under Apache 2 license.  See LICENSE for more details.
