window.addEventListener('DOMContentLoaded', () => {
  const importButton = element('button', {
    properties: {id: 'import', tabIndex: -1, title: 'インポート'},
  })/*html*/ `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 18 18">
      <path d="M10,2a7 7 0 1 0 6 6m-2,-4l-7,7h3m-3,0v-3" />
    </svg>
  `;
  menu.append(importButton);
  importButton.addEventListener('click', () => {
    const dlg = dialog({
      classList: 'import',
      closeable: true,
    })/*html*/ `
    `;
    showModal(dlg);
  });
});
