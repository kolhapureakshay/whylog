import { init } from './core/bootstrap';

// Auto-register with default options
init();

// Export for manual usage if needed
export { bus } from './core/bus';
export { configure } from './reporters/pretty';
