window.addEventListener('DOMContentLoaded', () => {
  menu.append(element('button', {
    properties: {id: 'export', tabIndex: -1, title: 'エクスポート'},
    listeners: {
      click() {
        openModalDialog({
          classList: 'export',
          closeable: true,
          initialize() {
            const textarea = this.querySelector('textarea')!;
            textarea.value = toMarkdown(contentBox, '')
              // 空行の前の末尾の空白は除去
              .replace(/ +(?=\n\n)/g, '')
              // 表の前後には改行を入れる
              .replace(
                /(?<!\n|\|)(?=\n[ \t]*\|)|(?<=\|\n)(?!\n|[ \t]*\|)/g,
                '\n'
              )
              // 連続した空行はひとつに
              .replace(/\n{3,}/g, '\n\n')
              // 末尾の改行はひとつだけ、末尾が改行でなくても改行を追加
              .replace(/(?:\n{2,}|(?<!\n))$/, '\n');
          },
        })/*html*/ `
          <textarea style="width:400px;height:300px"></textarea>
        `;
      },
    },
  })/* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M2.5 8.8a10 10 0 1 0 9.5-6.8m0 10l-7.2-10-1 4m1-4h4" />
    </svg>
  `);
});
