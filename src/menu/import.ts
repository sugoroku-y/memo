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
      <path d="M18 4a10 10 0 1 0 4 8m-2-4l-12 6m4 1l-4-1 1-4" />
    </svg>
  `);
});
