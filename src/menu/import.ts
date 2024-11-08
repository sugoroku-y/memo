window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'import', tabIndex: -1, title: 'インポート'},
    listeners: {
      click() {
        openModalDialog({
          classList: 'import',
          closeable: true,
        })/*html*/ `
        工事中
        `;
      },
    },
  })/*html*/ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M13 3a9 9 0 1 0 8 8m-3-5l-9 9h4m-4 0v-4" />
    </svg>
  `);
});
