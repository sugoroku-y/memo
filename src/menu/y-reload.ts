window.addEventListener('DOMContentLoaded', () => {
  const reload = element('button', {
    properties: {id: 'reload', tabIndex: -1, title: '再読込'},
  })/*html*/ `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 18 18">
      <path d="M5,3a7 7 0 1 0 8 0m0 3v-3h3" />
    </svg>
  `;
  menu.append(reload);
  reload.addEventListener('click', () => {
    worker?.postMessage({type: 'cache-clear'});
    location.reload();
  });
});
