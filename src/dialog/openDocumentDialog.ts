function openDocumentDialog() {
  let selected: string | undefined;
  const dlg = dialog({classList: 'open-document'})/*html*/ `
      <div class="list" tabIndex="1"></div>
      <div>
        <button disabled tabIndex="2">開く</button>
        <button type="button" name="cancel" tabIndex="3">キャンセル</button>
        <button type="button" name="new" tabIndex="4">新規作成</button>
      </div>
    `;
  const openButton = dlg.querySelector('button:not([type="button"])')!;
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
          <div class='list-item-title' title="${title}">${title}</div>
          <div class='list-item-last-modified'>${formatDate(
            'YYYY-MM-DD hh:mm',
            lastModified
          )}</div>
          <button type="button" name="another-tab" tabIndex="0">↗</button>
          <button type="button" name="delete" tabIndex="0">\u{1f5d1}\ufe0f</button>
        `);
    }
  })();
  const selectItem = (id?: string, item?: Element) => {
    for (const other of list.querySelectorAll('[data-selected]')) {
      other.removeAttribute('data-selected');
    }
    item?.setAttribute('data-selected', 'true');
    selected = id;
    openButton.disabled = id == null;
  };
  const selectNextItem = (direction: 'next' | 'previous') => {
    const item =
      list.querySelector(`.list-item[data-selected]`)?.[
        `${direction}ElementSibling`
      ] ?? list.firstElementChild;
    if (!item) {
      return false;
    }
    const newId = item?.getAttribute('data-id');
    if (!newId) {
      return false;
    }
    selectItem(newId, item);
    return true;
  };
  list.addEventListener('keydown', ev => {
    switch (`${ev.ctrlKey ? 'ctrl+' : ''}${ev.altKey ? 'alt+' : ''}${ev.key}`) {
      case 'ArrowUp':
        selectNextItem('previous') && ev.preventDefault();
        return;
      case 'ArrowDown':
        selectNextItem('next') && ev.preventDefault();
        return;
      case 'Enter':
        dlg.querySelector('button:not([type="button"])')?.click();
        return;
    }
  });
  dlg.addEventListener('click', ev => {
    const target = ev.target as HTMLElement;
    const button = target.closest('button');
    if (button?.type === 'submit') {
      return;
    }
    if (button?.name === 'cancel') {
      dlg.close();
      return;
    }
    if (button?.name === 'new') {
      dlg.close();
      documentId = undefined;
      location.hash = '';
      return;
    }
    const item = target.closest('.list-item');
    if (!item) {
      selectItem();
      return;
    }
    const id = item.getAttribute('data-id')!;
    if (button) {
      switch (button.name) {
        case 'another-tab':
          loadDocument(id).then(hash => window.open(`#${hash}`, '_blank'));
          break;
        case 'delete':
          deleteDocument(id).then(() => item.remove());
          break;
      }
      return;
    }
    selectItem(id, item);
  });
  dlg.addEventListener('submit', ev => {
    if (!selected) {
      ev.preventDefault();
      return;
    }
    loadDocument(selected).then(hash => {
      documentId = selected;
      location.hash = `#${hash}`;
    });
  });
  dlg.addEventListener('close', () => {
    dlg.remove();
  });
  document.body.append(dlg);
  dlg.showModal();
}
