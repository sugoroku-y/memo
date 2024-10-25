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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
      <path d="M5,3a7 7 0 1 0 8 0m0 3v-3h3" />
    </svg>
  `);
});
