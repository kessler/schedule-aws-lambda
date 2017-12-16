# schedule-aws-lambda

**attach a schedule to an existing aws lambda function**

[![npm status](http://img.shields.io/npm/v/schedule-aws-lambda.svg?style=flat-square)](https://www.npmjs.org/package/schedule-aws-lambda) 

## example

`npm i schedule-aws-lambda`

```js
const { Lambda, CloudWatchEvents } = require('aws-sdk')
const lambda = new Lambda()
const cloudwatch = new CloudWatchEvents()
const schedule = require('schedule-aws-lambda')(lambda, cloudwatch)

schedule('the-function-name').withInput({ foo: 'bar' }).at('rate(5 minutes)').then(console.log)
```

## api

This module exposes the following fluent interface:
```js
require('schedule-aws-lambda')(dependencies)(functionName)
    .[withInput(...) | input(...) | rule.id(...) | rule.name(...) | rule.description(...) ]
    .at(expression)
    .then(...)
```
_input() is an alias of withInput()_

alternatively one can use the `execute` api:
```js
require('schedule-aws-lambda')(dependencies)
    .execute({ functionName, functionInput }, { ruleName, ruleDescription, ruleId = ulid(), scheduleExpression })
    .then(...)
```

for further details examine the source and jsdocs

## license

[MIT](http://opensource.org/licenses/MIT) © Yaniv Kessler
