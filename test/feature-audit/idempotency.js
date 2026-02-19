const { init } = require('../../dist/core/bootstrap');
const { bus } = require('../../dist/core/bus');

console.log('Testing Idempotent Init...');

let busListenerCountBefore = bus.listeners.length;
console.log('Listeners before:', busListenerCountBefore);

init({ mode: 'dev' });
let busListenerCountAfterFirst = bus.listeners.length;
console.log('Listeners after 1st init:', busListenerCountAfterFirst);

init({ mode: 'prod' });
let busListenerCountAfterSecond = bus.listeners.length;
console.log('Listeners after 2nd init:', busListenerCountAfterSecond);

if (busListenerCountAfterFirst === busListenerCountAfterSecond) {
    console.log('SUCCESS: Listeners were not duplicated.');
} else {
    console.error('FAILURE: Listeners were duplicated!');
    process.exit(1);
}
