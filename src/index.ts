export const enum DURATION {
	SECOND = 1000,
	MINUTE = 60000,
	HOUR = 3600000,
	DAY = 86400000
}

type CallableFunction = (...args: any[]) => any

type SchedulerOptions = {
	duration: number | DURATION, call_limit: number
}[]

export default function createScheduler(options: SchedulerOptions) {
	const call_history = new Map<number, number[]>
	for (const { duration } of options) {
		call_history.set(duration, [])
	}


	return function <T extends CallableFunction>(fn: T) {

		for (const { duration, call_limit } of options) {
			const historical_calls = call_history.get(duration)

		}
	}
}

const schedule = createScheduler([{ duration: 10 * DURATION.SECOND, call_limit: 10 }])

schedule(console.log)