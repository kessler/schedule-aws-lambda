//env AWS_PROFILE=[profile] AWS_REGION=us-east-1 node integration.test.js

const BBPromise = require('bluebird')
const { Lambda, CloudWatchEvents, S3 } = require('aws-sdk')
let cloudwatchevents = new CloudWatchEvents()
const schedule = require('./index')(new Lambda(), cloudwatchevents)

let listRules = BBPromise.promisify(cloudwatchevents.listRules, { context: cloudwatchevents })
let deleteRule = BBPromise.promisify(cloudwatchevents.deleteRule, { context: cloudwatchevents })
let listTargetsByRule = BBPromise.promisify(cloudwatchevents.listTargetsByRule, { context: cloudwatchevents })
let removeTargets = BBPromise.promisify(cloudwatchevents.removeTargets, { context: cloudwatchevents })

let rules = new Map()

listRules().then((data) => {
	return BBPromise.map(data.Rules, (rule) => {
		let params = { Rule: rule.Name }

		listTargetsByRule(params)
			.then((result) => {
				if (result.Targets.length === 0) return
				params.Ids = []
				for (let target of result.Targets) {
					params.Ids.push(target.Id)
				}

				return removeTargets(params)
			})
			.then(() => {
				return deleteRule({ Name: rule.Name })
			})
	})

}).then(() => {
	return schedule('lambda1').at('cron(0 0 16 12 ? 2017)')
})
.then(console.log)
.catch(console.error)