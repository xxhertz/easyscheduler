/**
 * A list of commonly used durations of time, useful for quick references
 */
export const DURATION = {
	SECOND: 1000,
	MINUTE: 60000,
	HOUR: 3600000,
	DAY: 86400000
} as const

type CallableFunction = (...args: any[]) => any

/**
 * @example
 * { duration: DURATION.SECOND, call_limit: 10 }
 */
type SchedulerOptions = {
	readonly duration: number
	readonly call_limit: number
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export default class Scheduler {
	private readonly call_history: Map<number, number[]>
	private readonly options: SchedulerOptions[]

	/**
	 * Creates a new Scheduler
	 * 
	 * @example
	 * import Scheduler, { DURATION } from "easyscheduler"
	 * const scheduler = new Scheduler([{ duration: DURATION.SECOND, call_limit: 10 }])
	 */
	constructor(options: SchedulerOptions[]) {
		this.options = options.map(option => ({ duration: option.duration, call_limit: option.call_limit })) // lazy clone
		this.call_history = new Map<number, number[]>
		for (const { duration } of this.options)
			this.call_history.set(duration, [])
	}

	/**
	 * Calculates when the next function can be executed
	 * 
	 * @example
	 * import Scheduler, { DURATION } from "easyscheduler"
	 * const scheduler = new Scheduler([{ duration: DURATION.SECOND, call_limit: 10 }])
	 * 
	 * for (let i = 1; i <= 30; i++)
	 * 	scheduler.schedule(console.log, "test")
	 * 
	 * console.log(scheduler.time_until_available()) // should read ~1000
	 */
	time_until_available() {
		return Array.from(this.call_history).reduce((previous, [duration, call_history], idx) => {
			if (call_history.length >= this.options[idx].call_limit) {
				const time_since_eldest_call = Date.now() - call_history[0]
				if (time_since_eldest_call < duration)
					return previous + (duration - time_since_eldest_call) // parenthesis for clarity
				else
					call_history.shift()
			}

			return 0
		}, 0)
	}

	/**
	 * Schedule a function call to occur whenever next possible. To find out when the function may be called, use Scheduler.time_until_available()
	 * @example
	 * import Scheduler, { DURATION } from "easyscheduler"
	 * const scheduler = new Scheduler([{ duration: DURATION.SECOND, call_limit: 10 }])
	 * 
	 * for (let i = 1; i <= 30; i++)
	 * 	scheduler.schedule(console.log, "test")
	 * 
	 */
	async schedule<T extends CallableFunction>(fn: T, ...args: Parameters<T>): Promise<ReturnType<T>> {
		let time_until_ready = this.time_until_available()
		if (time_until_ready == 0) {
			const now = Date.now()
			for (const { duration } of this.options)
				this.call_history.get(duration)!.push(now)

			return fn(...args)
		}

		await sleep(time_until_ready)

		return this.schedule(fn, ...args)
	}

	/**
	 * A wrapper around `Scheduler.schedule` with the intention of being used for `Array.map`. Also maintains types
	 * 
	 * @example
	 * const scheduler = new Scheduler([{ duration: DURATION.SECOND, call_limit: 10 }])
	 * const nums = [1, 2, 3]
	 * const promises = nums.map(scheduler.map(v => v * 10))
	 * const numsx10 = await Promise.all(promises)
	 */
	map<T, U>(fn: (value: T, index: number, array: T[]) => U): (value: T, index: number, array: T[]) => Promise<U> {
		return (value, index, array) => this.schedule(fn, value, index, array)
	}
}