window.addEventListener('DOMContentLoaded', () => {
  const createNew = element('button', {
    properties: {
      id: 'create-new',
      tabIndex: -1,
      title: '新しいメモを開く',
      accessKey: 'N',
    },
  })/*html*/ `
    <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
      <path d="M12 22h-6a2 2 0 0 1-2-2v-16a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6m-12-3h8m-8 5h7m-7 5h4m1 1h10m-5-5v10" />
    </svg>
  `;
  menu.append(createNew);
  createNew.addEventListener('click', () => {
    openHash();
  });
});
