let rnd_state: number

const RND_A = 48271
const RND_M = 2147483647
const RND_Q = 44488
const RND_R = 3399

// https://github.com/blitz-research/blitz3d/blob/6beb288cb5962393684a59a4a44ac11524894939/bbruntime/bbmath.cpp#L44
export function seedRnd(seed: number) {
  seed = seed & 0x7FFFFFFF
  rnd_state = seed || 1
}

// TODO: precision is off
function internalRnd() {
  rnd_state = RND_A * (rnd_state % RND_Q) - RND_R * Math.floor(rnd_state / RND_Q)

  if (rnd_state < 0)
    rnd_state += RND_M
  return (rnd_state & 65535) / 65536.0 + (0.5 / 65536.0)
}

export function rnd(from: number, to = 0) {
  return internalRnd() * (to - from) + from
}
