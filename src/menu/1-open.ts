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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round" viewBox="0 0 24 24">
    <path d="M4 20h13l6-6h-13z"/>
    <path d="M7 16v-10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7 m-11-5h8m0 3h-8"/>
    <path d="M4 20v-13h3"/>
    </svg>
  `);
});
