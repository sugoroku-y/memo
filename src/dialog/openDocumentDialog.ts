/**
 * 保存したメモを開くダイアログ
 * @param currentDocumentId 編集中のメモのId。
 *
 * まだ開いていないときは省略する。
 */
function openDocumentDialog(currentDocumentId?: string) {
  const sortOrder: {
    column: 'title' | 'size' | 'lastModified';
    direction: 'prev' | 'next';
  } = {
    column: 'lastModified',
    direction: 'prev',
  };
  const dlg = dialog({
    classList: 'open-document',
    title: '保存したメモを開く',
  })/*html*/ `
    <div class="list">
      <div class="list-item-header">
        <div class="list-item-title">タイトル</div>
        <div class="list-item-size">サイズ</div>
        <div class="list-item-last-modified">最終更新日時</div>
      </div>
      <div class="list-item-footer">
        <button value="new" title="新しいメモ"></button>
      </div>
    </div>
    <button value="cancel" title="閉じる" tabIndex="-1" ${
      // まだメモを開いていないときは無効
      currentDocumentId ? '' : 'disabled'
    }></button>
  `;
  const list = dlg.querySelector('div.list')!;
  const header = list.firstElementChild as HTMLDivElement;
  header.addEventListener('click', ev => {
    const classname = (
      ['list-item-title', 'list-item-size', 'list-item-last-modified'] as const
    ).find(token => (ev.target as HTMLElement).classList.contains(token));
    if (!classname) {
      return;
    }
    sortOrder.column = (
      {
        'list-item-title': 'title',
        'list-item-size': 'size',
        'list-item-last-modified': 'lastModified',
      } as const
    )[classname];
    if (
      header.getAttribute('data-column') === sortOrder.column ||
      (sortOrder.column === 'lastModified' &&
        !header.hasAttribute('data-column'))
    ) {
      if (header.getAttribute('data-direction') === 'next') {
        header.removeAttribute('data-direction');
        sortOrder.direction = 'prev';
      } else {
        header.setAttribute('data-direction', 'next');
        sortOrder.direction = 'next';
      }
    } else {
      header.setAttribute('data-column', sortOrder.column);
      if (sortOrder.column === 'title') {
        // タイトルだけは昇順をデフォルトとする
        header.setAttribute('data-direction', 'next');
        sortOrder.direction = 'next';
      } else {
        header.removeAttribute('data-direction');
        sortOrder.direction = 'prev';
      }
    }
    reloadList();
  });
  const footer = list.lastElementChild as HTMLDivElement;
  // ホバーでフォーカスが移動するようにしておく
  dlg.addEventListener(
    'pointerenter',
    ev => {
      const target = ev.target as HTMLElement;
      const button = target.closest('button');
      if (button && button.tabIndex >= 0) {
        // フォーカスを持つボタンならフォーカス移動して終わり
        button.focus();
        return;
      }
      const item = target.closest('.list div.list-item');
      if (!item) {
        // ボタンでも項目でもなければ何もしない
        return;
      }
      const focusedItem = document.activeElement?.closest(
        '.list div.list-item'
      );
      if (focusedItem === item) {
        // ホバーされたのがフォーカスのある項目なら何もしない
        return;
      }
      // 項目内のボタンにフォーカスを移動
      item.querySelector('button')?.focus();
    },
    true
  );
  dlg.addEventListener(
    'pointerleave',
    ev => {
      const focusButton = document.activeElement?.closest('button');
      if (!focusButton) {
        // ボタンがフォーカスを持っていなければ何もしない
        return;
      }
      const target = ev.target as HTMLElement;
      const item = target.closest('.list div.list-item');
      const hoverItem = (ev.relatedTarget as HTMLElement)?.closest(
        '.list div.list-item'
      );
      if (item && item === hoverItem) {
        // ホバーしている項目内での移動では何もしない
        return;
      }
      // フォーカスを放棄
      focusButton.blur();
    },
    true
  );
  async function reloadList() {
    for (const item of list.querySelectorAll('div.list-item')) {
      item.remove();
    }
    for await (const [id, {title, lastModified, size}] of listDocuments(
      sortOrder.column,
      sortOrder.direction
    )) {
      if (id === currentDocumentId) {
        // 開いているメモはリストから除外
        continue;
      }
      const item = element('div', {classList: 'list-item'})/* html */ `
          <div class="list-item-title" title="${title}">${title}</div>
          <div class="list-item-size">${
            // メモのサイズ(圧縮・暗号化後)
            size ? String(size).replace(/(?<=\d)(?:=(?:\d{3})+$)/g, ',') : '-'
          }</div>
          <div class="list-item-last-modified">${
            // 最終更新日時
            formatDate('YYYY-MM-DD hh:mm', lastModified)
          }</div>
          <div class="list-item-buttons">
            <button type="button" name="open" title="開く" autofocus></button>
            <button type="button" name="another-tab" title="別タブで開く"></button>
            <button type="button" name="delete" title="削除"></button>
          </div>
        `;
      const load = async () => {
        const hash = await loadDocument(id);
        try {
          // デコード可能か確認する
          await decodeHash(await keyPromise, hash);
        } catch {
          // 復号に失敗したら確認してから削除
          if (
            await confirmDialog('復号に失敗しました。このメモを削除しますか?')
          ) {
            deleteDocument(id);
            item.remove();
          }
          return undefined;
        }
        return hash;
      };
      item.addEventListener('click', ev => {
        const button = (ev.target as HTMLElement).closest('button');
        switch (button?.name) {
          case 'another-tab':
            (async () => {
              // 別タブで開く
              const hash = await load();
              if (hash) {
                window.open(`${location.pathname}#${hash}`, '_blank');
              }
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
            // 項目内のボタン以外をクリックしても開くボタンを押したことにして選択したメモを開く
            (async () => {
              const hash = await load();
              if (hash) {
                openHash(hash);
                dlg.close();
              }
            })();
            return;
        }
      });
      footer.before(item);
    }
    list.querySelector('button')?.focus();
  }
  reloadList();
  /**
   * 選択項目の次を選択する
   * @param direction 次の方向を指定する
   */
  const selectNextItem = (direction: 'forward' | 'backword') => {
    const selected = document.activeElement?.closest(`.list div.list-item`);
    const item = selected
      ? // 選択している項目があればその次の項目を選択
        (selected?.[
          `${direction === 'forward' ? 'next' : 'previous'}ElementSibling`
        ] as HTMLElement)
      : // 選択していない状態のときは先頭を選択
        list.querySelector('.list-item');
    if (!item?.classList.contains('list-item')) {
      // 念のため項目かどうかを確認。項目でなければ選択を変更しない。
      return false;
    }
    // 項目内の先頭のボタンにフォーカスを移す
    item.querySelector('button')?.focus();
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
  dlg.addEventListener('close', ev => {
    if (dlg.returnValue !== 'new') {
      // 新しいメモを開くボタン以外のsubmitは何もしないで閉じる
      return;
    }
    // 新しいメモを開く
    openHash();
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
