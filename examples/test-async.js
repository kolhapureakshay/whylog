async function riskyBusiness() {
  throw new Error('Async boom!');
}
riskyBusiness();
