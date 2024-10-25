window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'import', tabIndex: -1, title: 'インポート'},
    listeners: {
      click: () => {
        const dlg = dialog({
          classList: 'import',
          closeable: true,
        })/*html*/ `
        `;
        showModal(dlg);
      },
    },
  })/*html*/ `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 18 18">
      <path d="M10,2a7 7 0 1 0 6 6m-2,-4l-7,7h3m-3,0v-3" />
    </svg>
  `);
});
