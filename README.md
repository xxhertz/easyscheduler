# Why another rate limiter?
I was using Riot Games' API and they featured two rate limits. They allow 20 requests per second, and 100 every 2 minutes. I couldn't find a solution I deemed simple enough so I made my own. 


```ts
const scheduler = new Scheduler(options: SchedulerOptions[])

scheduler.schedule(fn) => Promise<ReturnType<fn>>
```

# Example
```ts
import Scheduler, { DURATION } from "easyscheduler"
const scheduler = new Scheduler([
	{ duration: DURATION.SECOND, call_limit: 10 },
	{ duration: 2 * DURATION.SECOND, call_limit: 15 }
])

for (let i = 1; i <= 30; i++)
	scheduler.schedule(console.log, i)
// or
for (let i = 1; i <= 30; i++)
	scheduler.schedule(() => console.log(i))

```

Currently, in 2.0, **call order is not consistently respected**. After any rate limitation hits, calls will be re-ordered to the end of the schedule.

# Features

```ts
// new Scheduler(SchedulerOptions[])
const scheduler = new Scheduler([{ duration: DURATION.SECOND, call_limit: 10 }])

// scheduler.schedule(fn, ...args)
for (let i = 1; i <= 30; i++)
	scheduler.schedule(console.log, "test")
// scheduler.time_until_available()
console.log(scheduler.time_until_available()) // in milliseconds, should be around 1000 in this example

// scheduler.map(fn)
const nums = [1, 2, 3]
const promises = nums.map(scheduler.map(v => v * 10))
Promise.all(promises).then(console.log)
```

# Riot Fetch Wrapper Example
```ts
import Scheduler, { DURATION } from "easyscheduler"
const scheduler = new Scheduler([
	{ duration: DURATION.SECOND, call_limit: 20 },
	{ duration: 2 * DURATION.MINUTE, call_limit: 100 }
])

const riot_fetch = (endpoint: string) => scheduler.schedule(fetch, endpoint, { headers: { "X-Riot-Token": "RIOT-GAMES-TOKEN" } }).then(res => res).then(res => res.json())
```

## TODO:
- [ ] Maintain call order after a rate limit is reached
- [ ] Add option to maintain call_history records until Promises fully resolve when the function returns a Promise
- [ ] Add logic to warn for using pointless rate limits (if you can make 1 call per second, there's no point in having a second rate limit that only allows 60 calls per minute)