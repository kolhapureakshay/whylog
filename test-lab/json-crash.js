// test-lab/json-crash.js
const badJson = '{"name": "whylog", "broken": }';

function parseConfig() {
    JSON.parse(badJson);
}

parseConfig();
