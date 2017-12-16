const { expect } = require('chai')
const scheduler = require('./index')

describe('schedule-aws-lambda', () => {
	it('attaches a schedule to an existing lambda function', () => {
		const id = 1
		const functionName = 'my-lambda'
		const scheduleExpression = 'rate(5 minutes)'
		const functionInput = { a: 'foo' }
		const functionArn = '123'

		const cloudWatchEvents = new MockCloudWatchEvent()
		const lambda = new MockLambda(functionArn)

		const schedule = scheduler(lambda, cloudWatchEvents)

		return schedule(functionName).withInput(functionInput).rule.id(id).at(scheduleExpression).then(verifyAssertions)

		function verifyAssertions(result) {

			expect(lambda.params).to.deep.equal({
				FunctionName: functionName
			})

			expect(cloudWatchEvents.putRuleParams).to.deep.equal({
				Name: `schedule-lambda-${functionName}-${id}`,
				Description: `schedule lambda execution: "${scheduleExpression}"`,
				ScheduleExpression: scheduleExpression
			})
			
			expect(cloudWatchEvents.putTargetsParams).to.deep.equal({
				Rule: `schedule-lambda-${functionName}-${id}`,
				Targets: [{
					Input: JSON.stringify(functionInput),
					Arn: functionArn,
					Id: id
				}]
			})

			expect(result).to.equal('awsresult')
		}
	})

	class MockCloudWatchEvent {
		putRule(params, callback) {
			this.putRuleParams = params
			setImmediate(callback)
		}

		putTargets(params, callback) {
			this.putTargetsParams = params
			setImmediate(() => {
				callback(null, 'awsresult')
			})
		}
	}

	class MockLambda {
		constructor(arn) {
			this._arn = arn
		}

		getFunction(params, callback) {
			this.params = params
			setImmediate(() => {
				callback(null, { Configuration: { FunctionArn: this._arn } })
			})
		}
	}
})