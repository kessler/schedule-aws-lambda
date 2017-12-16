// first module with promises :-)

const { ulid } = require('ulid')
const { isDefined } = require('util')

const BBPromise = require('bluebird')

/**
 *	initialize the module with aws-sdk dependencies and optional bluebird promise config
 *
 *	@param {object} lambda - an instance of require('aws-sdk').Lambda
 *	@param {object} cloudWatchEvents - an instance of require('aws-sdk').CloudWatchEvents
 *	@param {object} [bboptions] - optional parameter to configure bluebird promise library
 *
 *	@public
 *	@returns {function} returns a function that starts the fluent interface chain
 */
module.exports = (lambda, cloudWatchEvents, bboptions) => {

	if (bboptions) {
		BBPromise.config(bboptions)		
	}

	this.execute = execute

	return schedule

	/**
	 *	starts the fluent interface chain
	 *
	 *	@param {string} functionName - the name of an existing lambda function that will be scheduled
	 *
	 *	@public
	 *	@returns {object} fluent interface
	 *
	 */
	function schedule(functionName) {
		if (typeof(functionName) !== 'string') {
			throw new TypeError('invalid or missing function name')
		}

		let functionOptions = { functionName }
		let ruleOptions = {}

		let fluentInterface = {
			at: atFunctor,
			withInput: inputFunctor,
			input: inputFunctor,
			rule: {
				id: ruleOption('ruleId'),
				name: ruleOption('ruleName'),
				description: ruleOption('ruleDescription')
			}
		}

		return fluentInterface

		// final stage
		function atFunctor(scheduleExpression) {
			verifyScheduleExpression(scheduleExpression)
			ruleOptions.scheduleExpression = scheduleExpression
			return execute(functionOptions, ruleOptions)
		}

		function inputFunctor(functionInput) {
			functionOptions.functionInput = JSON.stringify(functionInput)
			return fluentInterface
		}

		function ruleOption(name) {
			return value => {
				ruleOptions[name] = value
				return fluentInterface
			}
		}
	}

	function execute({ functionName, functionInput }, { ruleName, ruleDescription, ruleId = ulid(), scheduleExpression }) {
		let getFunction = BBPromise.promisify(lambda.getFunction, { context: lambda })

		let putRule = BBPromise.promisify(cloudWatchEvents.putRule, { context: cloudWatchEvents })
		ruleName = ruleName || `schedule-lambda-${functionName}-${ruleId}`
		ruleDescription = ruleDescription || `schedule lambda execution: "${scheduleExpression}"`
		let putRuleParams = {
			Name: ruleName,
			Description: ruleDescription,
			ScheduleExpression: scheduleExpression
		}

		let putTargets = BBPromise.promisify(cloudWatchEvents.putTargets, { context: cloudWatchEvents })
		let putTargetsParams = {
			Rule: ruleName,
			Targets: [{
				Input: functionInput,
				Arn: undefined,
				Id: ruleId
			}]
		}

		return getFunction({ FunctionName: functionName })
			.then(functionData => putTargetsParams.Targets[0].Arn = functionData.Configuration.FunctionArn)
			.then(putRule(putRuleParams))
			.then(() => putTargets(putTargetsParams))
	}
}


function verifyScheduleExpression(expression) {
	if (expression.startsWith('rate')) {
		return
	}

	if (expression.startsWith('cron')) {
		return
	}

	throw new Error('invalid expression')
}