function confirmDialog(message: string): Promise<boolean> {
  const dlg = dialog({classList: 'confirm'})/*html*/ `
    <div class="message">${message}</div>
    <div class="buttons">
      <button value="yes">はい</button>
      <button value="no">いいえ</button>
    </div>
  `;
  document.body.append(dlg);
  dlg.showModal();
  return new Promise(resolve => {
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue === 'yes');
    });
  });
}
