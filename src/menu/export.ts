window.addEventListener('DOMContentLoaded', () => {
  const exportButton = element('button', {
    properties: {id: 'export', tabIndex: -1, title: 'エクスポート'},
  })/* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 18 18">
      <path d="M2,8a7 7 0 1 0 6-6m3,9l-7-7h3m-3,0v3" />
    </svg>
  `;
  menu.append(exportButton);
  exportButton.addEventListener('click', () => {
    const dlg = dialog({
      classList: 'export',
      closeable: true,
    })/*html*/ `
    `;
    showModal(dlg);
  });
});
