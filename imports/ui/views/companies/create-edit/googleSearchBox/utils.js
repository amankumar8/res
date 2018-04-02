export function waitForPlaceholder(input, template) {
  const wait = setInterval(function() {
    if(input.placeholder === 'Enter a query') {
      input.placeholder = 'Enter address';
      stop();
      template.isAddressFieldReady.set(true);
    }
  }, 100);

  function stop() {
    clearInterval(wait);
  }
}