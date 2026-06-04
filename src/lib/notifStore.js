import { useState, useEffect } from 'react';

// Module-level reactive store — survives re-renders, shared across all instances
let _count = 0;
const _subs = new Set();

const notifStore = {
  get:   ()       => _count,
  set:   (n)      => { _count = n; _subs.forEach(fn => fn(_count)); },
  inc:   (by = 1) => notifStore.set(_count + by),
  dec:   (by = 1) => notifStore.set(Math.max(0, _count - by)),
  reset: ()       => notifStore.set(0),
};

export function useNotifCount() {
  const [count, setCount] = useState(_count);
  useEffect(() => {
    setCount(_count);
    _subs.add(setCount);
    return () => _subs.delete(setCount);
  }, []);
  return count;
}

export default notifStore;
