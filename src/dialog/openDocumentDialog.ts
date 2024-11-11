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
  openModalDialog({
    classList: 'open-document',
    // メモを開いていない状態のときは閉じるボタン、Escapeキーで閉じないようにする
    closeable: currentDocumentId != null,
    listeners: {
      // ホバーでフォーカスが移動するようにしておく
      pointerenter$(ev) {
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
      pointerleave$(ev) {
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
        // フォーカスをダイアログに移す
        this.focus();
      },
      keydown(ev) {
        switch (
          `${ev.key.length > 1 && ev.shiftKey ? 'shift+' : ''}${
            ev.ctrlKey ? 'ctrl+' : ''
          }${ev.altKey ? 'alt+' : ''}${ev.key}`
        ) {
          case 'ArrowUp':
            // ↑が押されたら逆順で次の項目を選択
            selectNextItem(this, 'backword') && ev.preventDefault();
            return;
          case 'ArrowDown':
            // ↓が押されたら正順で次の項目を選択
            selectNextItem(this, 'forward') && ev.preventDefault();
            return;
          case 'Delete':
            // フォーカスのある項目を削除
            document.activeElement
              ?.closest('div.list-item')
              ?.querySelector('button[name=delete]')
              ?.click();
            return;
          case 'alt+Enter':
            // フォーカスのある項目を別タブで開く
            document.activeElement
              ?.closest('div.list-item')
              ?.querySelector('button[name=another-tab]')
              ?.click();
            return;
        }
      },
      close() {
        if (this.returnValue !== 'new') {
          // 新しいメモを開くボタン以外のsubmitは何もしないで閉じる
          return;
        }
        // 新しいメモを開く
        openHash();
      },
    },
    initialize() {
      const list = this.querySelector('div.list')!;
      const header = list.firstElementChild as HTMLDivElement;
      header.addEventListener('click', ev => {
        const classname = (
          [
            'list-item-title',
            'list-item-size',
            'list-item-last-modified',
          ] as const
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
        reloadList(this, list, footer);
      });
      const footer = list.lastElementChild as HTMLDivElement;
      reloadList(this, list, footer);
    },
  })/*html*/ `
    <div class="list">
      <div class="list-item-header">
        <div class="list-item-title">タイトル</div>
        <div class="list-item-size">サイズ</div>
        <div class="list-item-last-modified">最終更新日時</div>
      </div>
      <div class="list-item-footer">
        <button value="new" title="新しいメモ(N)" accesskey="N">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 22h-6a2 2 0 0 1-2-2v-16a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6m-12-3h8m-8 5h7m-7 5h4m1 1h10m-5-5v10" />
          </svg>
        </button>
      </div>
    </div>
  `;

  async function reloadList(
    dlg: HTMLDialogElement,
    list: HTMLDivElement,
    footer: HTMLDivElement
  ) {
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
      const item = element('div', {
        classList: 'list-item',
        listeners: {
          click: ev => {
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
                  if (answer === 'no') {
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
          },
        },
      })/* html */ `
          <div class="list-item-title" title="${title}"></div>
          <div class="list-item-size" data-content="${
            // メモのサイズ(圧縮・暗号化後)
            size ? String(size).replace(/(?<=\d)(?:=(?:\d{3})+$)/g, ',') : '-'
          }"></div>
          <div class="list-item-last-modified" data-content="${
            // 最終更新日時
            formatDate('YYYY-MM-DD hh:mm', lastModified)
          }"></div>
          <div class="list-item-buttons">
            <button type="button" name="open" title="開く" autofocus>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 22a2 2 0 0 1-2-2v-7m0-8v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-12M2 9h13m-3 3l3-3-3-3"/>
              </svg>
            </button>
            <button type="button" name="another-tab" title="別タブで開く">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 22a2 2 0 0 1-2-2v-7m0-8v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10m-8 8h-6M2 9h13m-3 3l3-3-3-3M16 23v-10m-5 5h10"/>
              </svg>
            </button>
            <button type="button" name="delete" title="削除">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 10l3 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l3-11m3-2l-18-6m6 2a5 2 18 1 1 6 2m-16 2a8 14 0 0 1 12 7l2-2m-2 2l-3-1"/>
              </svg>
            </button>
          </div>
        `;
      const load = async () => {
        const hash = await loadDocument(id);
        try {
          // デコード可能か確認する
          await decodeHash(await keyPromise, hash);
        } catch {
          // 復号に失敗したら確認してから削除
          const answer = await confirmDialog(
            '復号に失敗しました。このメモを削除しますか?'
          );
          if (answer === 'yes') {
            deleteDocument(id);
            item.remove();
          }
          return undefined;
        }
        return hash;
      };
      footer.before(item);
    }
    list.querySelector('button')?.focus();
  }

  /**
   * 選択項目の次を選択する
   * @param direction 次の方向を指定する
   */
  function selectNextItem(
    dlg: HTMLDialogElement,
    direction: 'forward' | 'backword'
  ) {
    const selected = document.activeElement?.closest(`.list div.list-item`);
    const item = selected
      ? // 選択している項目があればその次の項目を選択
        (selected?.[
          `${direction === 'forward' ? 'next' : 'previous'}ElementSibling`
        ] as HTMLElement)
      : // 選択していない状態のときは先頭を選択
        dlg.querySelector('.list-item');
    if (!item?.classList.contains('list-item')) {
      // 念のため項目かどうかを確認。項目でなければ選択を変更しない。
      return false;
    }
    // 項目内の先頭のボタンにフォーカスを移す
    item.querySelector('button')?.focus();
    return true;
  }
}
