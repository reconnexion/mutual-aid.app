/** Calls `fn` after each delay in turn — the Pod provider processes posted activities (side
 *  effects like attaching a new `as:likes`/`as:replies` collection) asynchronously via a queue,
 *  so a single fixed delay before refreshing is unreliable; a few spaced-out attempts catch it
 *  whether it lands in under a second or takes several. */
export const retryRefresh = (fn: () => void, delaysMs: number[] = [800, 2000, 4000]) => {
  delaysMs.forEach(delay => setTimeout(fn, delay));
};
