//THIS SCRIPT IS FOR LOADING GENERATIONS IN PARALLEL, BUT NOT TOO MANY AT ONCE.
/**
 * Caps how many creations are fetched at once.
 *
 * HTTP/2 will happily open a stream per tile, and a cold Cloudflare transform
 * is real work at the edge — a whole archive asking at once is what makes the
 * first screenful slow. Twelve keeps the visible rows saturated without
 * queueing the edge behind rows nobody has scrolled to.
 */
const MAX_PARALLEL = 12

let running = 0
const waiting: (() => void)[] = []

function pump() {
  while (running < MAX_PARALLEL && waiting.length > 0) {
    running += 1
    waiting.shift()!()
  }
}

/**
 * Runs `start` once a slot frees up.
 *
 * Returns the release, which must be called when the load finishes **and** on
 * unmount — a tile scrolled past before its turn has to leave the queue, or
 * the slots fill with work nobody is waiting for. Calling it twice is safe.
 */
export function requestSlot(start: () => void) {
  let state: 'waiting' | 'running' | 'released' = 'waiting'

  const begin = () => {
    state = 'running'
    start()
  }

  waiting.push(begin)
  pump()

  return () => {
    if (state === 'released') return

    if (state === 'waiting') {
      const index = waiting.indexOf(begin)

      if (index !== -1) waiting.splice(index, 1)
    } else {
      running -= 1
      pump()
    }

    state = 'released'
  }
}
