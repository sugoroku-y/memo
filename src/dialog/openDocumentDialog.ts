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
      currentDocumentId ? '' : 'disabled'
    }></button>
  `;
  const list = dlg.querySelector('div.list')!;
  (async () => {
    for await (const [id, {title, lastModified}] of listDocuments()) {
      if (id === currentDocumentId) {
        continue;
      }
      const item = element('div', {
        classList: 'list-item',
        properties: {tabIndex: 0},
      })/* html */ `
          <div class="list-item-title" title="${title}">${title}</div>
          <div class="list-item-last-modified">${formatDate(
            'YYYY-MM-DD hh:mm',
            lastModified
          )}</div>
          <div class="list-item-buttons">
            <button type="button" name="open" title="開く"></button>
            <button type="button" name="another-tab" title="別タブで開く"></button>
            <button type="button" name="delete" title="削除"></button>
          </div>
        `;
      item.addEventListener('focus', () => {
        selectItem(item);
      });
      item.addEventListener('blur', ev => {
        if ((ev.relatedTarget as HTMLElement)?.closest('.list-item') !== item) {
          item.removeAttribute('data-selected');
          item.blur();
        }
      });
      item.addEventListener('pointerenter', () => {
        selectItem(item);
      });
      item.addEventListener('pointerleave', () => {
        item.removeAttribute('data-selected');
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
          item.click();
        }
      });
      item.addEventListener('click', ev => {
        switch ((ev.target as HTMLElement).closest('button')?.name) {
          case 'another-tab':
            (async () => {
              const hash = await loadDocument(id);
              window.open(`${location.pathname}#${hash}`, '_blank');
            })();
            break;
          case 'delete':
            (async () => {
              const answer = await confirmDialog(
                `${title}を削除します。\nよろしいですか?`
              );
              if (!answer) {
                return;
              }
              await deleteDocument(id);
              item.remove();
            })();
            break;
          default:
            (async () => {
              const hash = await loadDocument(id);
              dlg.close();
              documentId = id;
              location.replace(`${location.pathname}#${hash}`);
            })();
            break;
        }
      });
      list.append(item);
    }
  })();
  const selectItem = (item: HTMLElement) => {
    item.focus();
    for (const other of list.querySelectorAll('[data-selected]')) {
      other.removeAttribute('data-selected');
    }
    item.setAttribute('data-selected', 'true');
  };
  const selectNextItem = (direction: 'forward' | 'backword') => {
    const selected = list.querySelector(`.list-item[data-selected]`);
    const item = selected
      ? (selected?.[
          `${direction === 'forward' ? 'next' : 'previous'}ElementSibling`
        ] as HTMLElement)
      : list.querySelector('.list-item');
    if (!item?.classList.contains('list-item')) {
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
        selectNextItem('backword') && ev.preventDefault();
        return;
      case 'ArrowDown':
        selectNextItem('forward') && ev.preventDefault();
        return;
    }
  });
  dlg.addEventListener('close', () => {
    if (dlg.returnValue === 'new') {
      location.replace(location.pathname);
      return;
    }
  });
  if (!currentDocumentId) {
    dlg.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
      }
    });
  }
  document.body.append(dlg);
  dlg.showModal();
}
