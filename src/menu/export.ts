window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'export', tabIndex: -1, title: 'エクスポート'},
    listeners: {
      click: () => {
        const dlg = dialog({
          classList: 'export',
          closeable: true,
        })/*html*/ `
        `;
        showModal(dlg);
      },
    },
  })/* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M3,10a9 9 0 1 0 8-8m4 12l-9-9h4m-4 0v4" />
    </svg>
  `);
});
