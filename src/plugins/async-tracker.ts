let enabled = false;
let hook: any = null;
const asyncStacks = new Map<number, string>();

export function initAsyncTracker(enable: boolean) {
    if (!enable || enabled || typeof require === 'undefined') return;
    try {
        const async_hooks = require('async_hooks');
        hook = async_hooks.createHook({
            init(asyncId: number, type: string, triggerAsyncId: number) {
                if (type === 'PROMISE' || type === 'Timeout') {
                    const err: any = {};
                    Error.captureStackTrace(err);
                    let stack = err.stack;
                    if (asyncStacks.has(triggerAsyncId)) {
                        stack += '\n    --- async boundary ---\n' + asyncStacks.get(triggerAsyncId);
                    }
                    asyncStacks.set(asyncId, stack);
                }
            },
            destroy(asyncId: number) {
                asyncStacks.delete(asyncId);
            }
        });
        hook.enable();
        enabled = true;
    } catch (e) {}
}

export function getAsyncStack(asyncId?: number): string | undefined {
    if (!enabled || typeof require === 'undefined') return undefined;
    try {
        const async_hooks = require('async_hooks');
        return asyncStacks.get(asyncId || async_hooks.executionAsyncId());
    } catch (e) {
        return undefined;
    }
}
