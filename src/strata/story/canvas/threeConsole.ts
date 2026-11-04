import { getConsoleFunction, setConsoleFunction } from 'three';

/** R3F 9.8 (the latest release) still builds its store clock from THREE.Clock, which three 0.186 flags on every load. */
const CLOCK_DEPRECATED = 'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.';

type StackTrace = { isStackTrace: true; getError(message: string): Error };

if (!getConsoleFunction()) {
  setConsoleFunction((type: 'log' | 'warn' | 'error', message: string, ...params: unknown[]) => {
    if (message === CLOCK_DEPRECATED) return;
    const trace = params[0] as StackTrace | undefined;
    if (trace?.isStackTrace) console[type](trace.getError(message));
    else console[type](message, ...params);
  });
}
