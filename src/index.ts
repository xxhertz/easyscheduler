export enum DURATION {
	SECOND = 1000,
	MINUTE = 60000,
	HOUR = 3600000,
	DAY = 86400000
}

type CallableFunction = (...args: any[]) => any

type SchedulerOptions = {
	duration: number | DURATION, call_limit: number
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function time_until_available(call_limit: number, duration: number, call_history: number[]) {
	if (call_history.length >= call_limit) {
		const time_since_eldest_call = Date.now() - call_history[0]

		// our eldest call has not expired yet, we have to wait this amount of time
		if (time_since_eldest_call < duration)
			return duration - time_since_eldest_call

		// our eldest call has expired, clear it
		call_history.shift()
	}
	// return 0, signifying that we are ready to call
	return 0
}

export default function createScheduler(options: SchedulerOptions[]) {
	const call_history = new Map<number, number[]>
	for (const { duration } of options) {
		call_history.set(duration, [])
	}

	return async function schedule<T extends CallableFunction>(fn: T): Promise<ReturnType<T>> {
		let total_time = 0
		for (const { duration, call_limit } of options) {
			const calls_per_duration = call_history.get(duration) as number[] // this is guaranteed to exist unless there was some serious memory issues (as per line 34)
			const time_per_duration = time_until_available(call_limit, duration, calls_per_duration)
			total_time += time_per_duration
		}

		if (total_time == 0) {
			const now = Date.now()
			for (const { duration } of options)
				call_history.get(duration)?.push(now)

			return fn()
		}

		await sleep(total_time)

		return schedule(fn)
	}
}