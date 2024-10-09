function openDocumentDialog() {
  let selected: string | undefined;
  const dlg = dialog({classList: 'open-document'})/*html*/ `
      <button value="cancel" title="閉じる" tabIndex="-1"></button>
      <div class="list" tabIndex="1" autofocus>
        <div class="list-item-new">
          <div class="list-item-title"><button value="new" title="新しいメモ"></button></div>
          <div class="list-item-last-modified">最終更新日時</div>
          <div class="list-item-buttons"></div>
        </div>
      </div>
    `;
  const list = dlg.querySelector('div.list')!;
  const currentDocumentId = documentId;
  (async () => {
    for await (const [id, {title, lastModified}] of listDocuments()) {
      if (id === currentDocumentId) {
        continue;
      }
      list.append(element('div', {
        classList: 'list-item',
        data: {id},
      })/* html */ `
          <div class="list-item-title" title="${title}">${title}</div>
          <div class="list-item-last-modified">${formatDate(
            'YYYY-MM-DD hh:mm',
            lastModified
          )}</div>
          <div class="list-item-buttons">
            <button type="button" name="open" title="開く" tabIndex="-1"></button>
            <button type="button" name="another-tab" title="別タブで開く" tabIndex="-1"></button>
            <button type="button" name="delete" title="削除" tabIndex="-1"></button>
          </div>
        `);
    }
  })();
  const selectItem = (item?: Element) => {
    list.focus();
    for (const other of list.querySelectorAll('[data-selected]')) {
      other.removeAttribute('data-selected');
    }
    for (const button of list.querySelectorAll(
      '.list-item button:not([tabindex="-1"])'
    )) {
      button.tabIndex = -1;
    }
    if (!item) {
      return;
    }
    item.setAttribute('data-selected', 'true');
    for (const button of item.querySelectorAll('button[tabindex]')) {
      button.tabIndex = 0;
    }
    selected = item.getAttribute('data-id') ?? undefined;
  };
  const selectNextItem = (direction: 'forward' | 'backword') => {
    const selected = list.querySelector(`.list-item[data-selected]`);
    const item = selected
      ? selected?.[
          `${direction === 'forward' ? 'next' : 'previous'}ElementSibling`
        ]
      : list.querySelector('.list-item');
    if (!item?.classList.contains('list-item')) {
      return false;
    }
    selectItem(item);
    return true;
  };
  list.addEventListener('keydown', ev => {
    switch (`${ev.ctrlKey ? 'ctrl+' : ''}${ev.altKey ? 'alt+' : ''}${ev.key}`) {
      case 'ArrowUp':
        selectNextItem('backword') && ev.preventDefault();
        return;
      case 'ArrowDown':
        selectNextItem('forward') && ev.preventDefault();
        return;
      case 'Enter':
        {
          const target =
            (ev.target as HTMLElement).closest('button') ??
            list.querySelector(`.list-item[data-id="${selected}"]`);
          if (!target) {
            break;
          }
          target.click();
          ev.preventDefault();
          ev.stopPropagation();
        }
        return;
    }
  });
  dlg.addEventListener('close', ev => {
    if (dlg.returnValue === 'new') {
      location.replace(location.pathname);
      return;
    }
  });
  dlg.addEventListener('click', ev => {
    const target = ev.target as HTMLElement;
    const button = target.closest('button');
    if (button?.type === 'submit') {
      return;
    }
    const item = target.closest('.list-item');
    if (!item) {
      selectItem();
      return;
    }
    const id = item.getAttribute('data-id')!;
    switch (button?.name) {
      case 'another-tab':
        (async () => {
          const hash = await loadDocument(id);
          window.open(`#${hash}`, '_blank');
        })();
        ev.preventDefault();
        ev.stopPropagation();
        break;
      case 'delete':
        (async () => {
          const answer = await confirmDialog(
            `${
              item.querySelector('.list-item-title')?.title ?? ''
            }を削除します。\nよろしいですか?`
          );
          if (!answer) {
            return;
          }
          await deleteDocument(id);
          item.remove();
        })();
        ev.preventDefault();
        ev.stopPropagation();
        break;
      default:
        (async () => {
          const hash = await loadDocument(id);
          if (!hash) {
            return;
          }
          dlg.close();
          documentId = selected;
          location.hash = `#${hash}`;
        })();
        break;
    }
    return;
  });
  document.body.append(dlg);
  dlg.showModal();
}
