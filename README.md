# EXPERIMENTAL - DO NOT USE IN PRODUCTION

# Why?
I was using Riot Games' API and they feature not one, but two rate limits. 20 every 1 second, and 100 every 2 minutes. No scheduler/rate limiter I came across was simple enough to make this task easy enough to overcome. 

# Usage
```js
createScheduler(options: SchedulerOptions[]) => scheduler(fn: Function)

schedule(fn) => Promise<fnReturnType> // return type is useful for maps
```

`createScheduler` creates a function which follows a rate limit (or multiple as seen in the example below)
# Example
```js
import createScheduler, { DURATION } from "easyscheduler"
const schedule = createScheduler([
	{ duration: DURATION.SECOND, call_limit: 10 },
	{ duration: 2 * DURATION.SECOND, call_limit: 15 }
])

for (let i = 1; i <= 30; i++)
	schedule(() => console.log(i))
```
`await` is usable & supported, however NOT recommended unless you know what you're doing.

Currently, in 1.0, **call order is not consistently respected**. After any rate limitation hits, some calls will be desynced and likely called at the end of the stack.

In the example above, you might get an output like:
`1...10 (skip 11) 12... (11 at the end)`
`await` syntax fixes this issue (in this context), as nothing gets scheduled until the previously scheduled function calls finish up.

## Riot Fetch Wrapper Example
```js
import createScheduler, { DURATION } from "easyscheduler"
const schedule = createScheduler([
	{ duration: DURATION.SECOND, call_limit: 20 },
	{ duration: 2 * DURATION.MINUTE, call_limit: 100 }
])

function riot_fetch(endpoint) {
	return schedule(async () => { // I don't think async/await does anything here, but I left it just in case..
		return await fetch(endpoint, { headers: { "X-Riot-Token": "RIOT-GAMES-TOKEN" }}).then(res => res.json())
	})
}
```
