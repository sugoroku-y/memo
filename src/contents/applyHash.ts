async function applyHash(root: HTMLDivElement) {
  const encoded = location.hash.slice(1);
  const decoded =
    encoded &&
    (await decodeHash(await keyPromise, encoded).catch(async () => {
      const answer = await confirmDialog(
        `
        復号に失敗しました。
        保存しているパスワードをリセットしますか?
        ※リセットしない場合新しいメモを開きます。
        `
          .replace(/^ +/gm, '')
          .slice(1, -1)
      );
      if (answer === 'yes') {
        // パスワードをリセットしてリロード
        configuration.resetCryptoKey();
      }
      // 新しいメモを開く
      openHash();
    }));
  if (decoded) {
    root.innerHTML = decoded;
    const sel = getSelection();
    if (sel) {
      const {node, offset} = restoreFocusInfo(root) ?? {
        node: document.querySelector('h1 ~ *') ?? root.firstChild,
        offset: 0,
      };
      sel.setPosition(node, offset);
    }
  } else {
    root.innerHTML = html/* html */ `
      <h1>${`# ${formatDate(configuration.titleFormat)}`}</h1>
      <div><br /></div>
    `;
    const br = root.querySelector('br')!;
    getSelection()?.setPosition(br.parentElement, 0);
  }
  root.focus();
}
