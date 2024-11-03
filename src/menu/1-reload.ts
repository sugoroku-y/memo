window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'reload', tabIndex: -1, title: '再読込'},
    listeners: {
      click: () => {
        worker?.postMessage({type: 'cache-clear'});
        location.reload();
      },
    },
  })/*html*/ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M6.4 4.4a9 9 0 1 0 11.2 0m0 4v-4h4" />
    </svg>
  `);
});
