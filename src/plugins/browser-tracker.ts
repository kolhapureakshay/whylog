import { BreadcrumbTracker } from '../core/breadcrumbs';

let initialized = false;

export function initBrowserTracker(enabled: boolean) {
    if (!enabled || initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Click events
    document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const info = target.tagName ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}${target.className ? `.${target.className.split(' ').join('.')}` : ''}` : 'unknown element';
        BreadcrumbTracker.add(`Clicked on ${info}`, 'ui');
    }, { capture: true, passive: true });

    // Fetch Interception
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : 'unknown');
        BreadcrumbTracker.add(`fetch: ${url}`, 'network');
        return originalFetch.apply(window, args as any);
    };

    initialized = true;
}
