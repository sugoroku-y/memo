window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {
      id: 'open',
      tabIndex: -1,
      title: '保存したメモを開く',
      accessKey: 'o',
    },
    listeners: {
      click: () => {
        openDocumentDialog(documentId);
      },
    },
  })/* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M3 21h14l6-7h-14zv-11h3M6 17v-13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9 m-11-3h8m0-4h-8"/>
    </svg>
  `);
});
