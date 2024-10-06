function openDocumentDialog() {
  let selected: string | undefined;
  const dlg = dialog({classList: 'open-document'})/*html*/ `
      <div class="list"></div>
      <div><button>開く</button><button type="button" name="cancel">キャンセル</button></div>
    `;
  const list = dlg.querySelector('div.list')!;
  (async () => {
    for await (const [id, {title, lastModified}] of listDocuments()) {
      list.append(element('div', {
        classList: 'list-item',
        data: {id},
      })/* html */ `
          <div class='list-item-title' title="${title}">${title}</div>
          <div class='list-item-last-modified'>${formatDate(
            'YYYY-MM-DD hh:mm',
            lastModified
          )}</div>
          <button type="button" name="another-tab">↗</button>
          <button type="button" name="delete">🗑</button>
        `);
    }
  })();
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
    const item = target.closest('.list-item');
    if (!item) {
      selected = undefined;
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
    selected = id;
    for (const other of list.querySelectorAll('[data-selected]')) {
      other.removeAttribute('data-selected');
    }
    item.setAttribute('data-selected', 'true');
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
