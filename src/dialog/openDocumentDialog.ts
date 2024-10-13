/**
 * 保存したメモを開くダイアログ
 * @param currentDocumentId 編集中のメモのId。
 *
 * まだ開いていないときは省略する。
 */
function openDocumentDialog(currentDocumentId?: string) {
  const dlg = dialog({classList: 'open-document'})/*html*/ `
    <div class="list">
      <div class="list-item-new">
        <div class="list-item-title"><button value="new" title="新しいメモ"></button></div>
        <div class="list-item-last-modified">最終更新日時</div>
        <div class="list-item-buttons"></div>
      </div>
    </div>
    <button value="cancel" title="閉じる" tabIndex="-1" ${
      // まだメモを開いていないときは無効
      currentDocumentId ? '' : 'disabled'
    }></button>
  `;
  const list = dlg.querySelector('div.list')!;
  (async () => {
    for await (const [id, {title, lastModified}] of listDocuments()) {
      if (id === currentDocumentId) {
        // 開いているメモはリストから除外
        continue;
      }
      const item = element('div', {
        classList: 'list-item',
        properties: {
          // 項目自体もフォーカスを受け取るようにする
          tabIndex: 0,
        },
      })/* html */ `
          <div class="list-item-title" title="${title}">${title}</div>
          <div class="list-item-last-modified">${
            // 最終更新日時
            formatDate('YYYY-MM-DD hh:mm', lastModified)
          }</div>
          <div class="list-item-buttons">
            <button type="button" name="open" title="開く"></button>
            <button type="button" name="another-tab" title="別タブで開く"></button>
            <button type="button" name="delete" title="削除"></button>
          </div>
        `;
      item.addEventListener('focus', () => {
        // フォーカスを受け取った項目を選択する
        selectItem(item);
      });
      item.addEventListener('blur', ev => {
        // フォーカスが移る先の項目
        const target = (ev.relatedTarget as HTMLElement)?.closest('.list-item');
        if (target !== item) {
          // 外部にフォーカスが移ったら選択解除
          item.removeAttribute('data-selected');
          item.blur();
        }
      });
      item.addEventListener('pointerenter', () => {
        // ホバーでも選択状態にする
        selectItem(item);
      });
      item.addEventListener('pointerleave', () => {
        // ホバーじゃなくなったら選択解除
        item.removeAttribute('data-selected');
        // フォーカスもなくす
        item.blur();
      });
      item.addEventListener('keydown', ev => {
        if (
          ev.target === item &&
          !ev.shiftKey &&
          !ev.ctrlKey &&
          !ev.altKey &&
          ev.key === 'Enter'
        ) {
          // 項目にフォーカスがある状態でEnterキーが押されたらクリックと同じ処理
          item.click();
        }
      });
      item.addEventListener('click', ev => {
        switch ((ev.target as HTMLElement).closest('button')?.name) {
          case 'another-tab':
            (async () => {
              // 別タブで開く
              const hash = await loadDocument(id);
              window.open(`${location.pathname}#${hash}`, '_blank');
            })();
            break;
          case 'delete':
            (async () => {
              // 削除
              const answer = await confirmDialog(
                `${title}を削除します。\nよろしいですか?`
              );
              if (!answer) {
                // いいえが選択されたら何もしない
                return;
              }
              await deleteDocument(id);
              item.remove();
            })();
            break;
          default:
            // openボタンでなくても項目をクリックしたら(別タブ/削除を除く)
            (async () => {
              // 選択したメモを開く
              const hash = await loadDocument(id);
              location.replace(`${location.pathname}#${hash}`);
            })();
            break;
        }
      });
      list.append(item);
    }
  })();
  /**
   * 項目を選択する
   * @param item 選択する項目
   */
  const selectItem = (item: HTMLElement) => {
    // フォーカスも移す
    item.focus();
    // data-selected属性は1つだけ
    for (const other of list.querySelectorAll('[data-selected]')) {
      other.removeAttribute('data-selected');
    }
    item.setAttribute('data-selected', 'true');
  };
  /**
   * 選択項目の次を選択する
   * @param direction 次の方向を指定する
   */
  const selectNextItem = (direction: 'forward' | 'backword') => {
    const selected = list.querySelector(`.list-item[data-selected]`);
    const item = selected
      ? (selected?.[
          `${direction === 'forward' ? 'next' : 'previous'}ElementSibling`
        ] as HTMLElement)
      : // 選択していない状態のときは先頭を選択
        list.querySelector('.list-item');
    if (!item?.classList.contains('list-item')) {
      // 念のため項目かどうかを確認。項目でなければ選択を変更しない。
      return false;
    }
    selectItem(item);
    return true;
  };
  dlg.addEventListener('keydown', ev => {
    switch (
      `${ev.key.length > 1 && ev.shiftKey ? 'shift+' : ''}${
        ev.ctrlKey ? 'ctrl+' : ''
      }${ev.altKey ? 'alt+' : ''}${ev.key}`
    ) {
      case 'ArrowUp':
        // ↑が押されたら逆順で次の項目を選択
        selectNextItem('backword') && ev.preventDefault();
        return;
      case 'ArrowDown':
        // ↓が押されたら正順で次の項目を選択
        selectNextItem('forward') && ev.preventDefault();
        return;
    }
  });
  dlg.addEventListener('close', () => {
    if (dlg.returnValue === 'new') {
      // 新しいメモを開く
      location.replace(location.pathname);
      return;
    }
  });
  if (!currentDocumentId) {
    // メモを開いていない状態のときはEscapeキーで閉じないようにする
    dlg.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
      }
    });
  }
  document.body.append(dlg);
  dlg.showModal();
}
