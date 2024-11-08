window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'export', tabIndex: -1, title: 'エクスポート'},
    listeners: {
      click: () => {
        const dlg = dialog({
          classList: 'export',
          closeable: true,
        })/*html*/ `
          <textarea style="width:400px;height:300px"></textarea>
        `;
        const textarea = dlg.querySelector('textarea')!;
        textarea.value = toMarkdown(contentBox, '')
          // 空行の前の末尾の空白は除去
          .replace(/ +(?=\n\n)/g, '')
          // 表の前後には改行を入れる
          .replace(/(?<!\n|\|)(?=\n[ \t]*\|)|(?<=\|\n)(?!\n|[ \t]*\|)/g, '\n')
          // 連続した空行はひとつに
          .replace(/\n{3,}/g, '\n\n')
          // 末尾の改行はひとつだけ、末尾が改行でなくても改行を追加
          .replace(/(?:\n{2,}|(?<!\n))$/, '\n');
        showModal(dlg);
      },
    },
  })/* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M3,10a9 9 0 1 0 8-8m4 12l-9-9h4m-4 0v4" />
    </svg>
  `);
});
