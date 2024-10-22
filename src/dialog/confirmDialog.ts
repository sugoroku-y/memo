function confirmDialog(message: string) {
  return showModal(dialog({classList: 'confirm'})/*html*/ `
    <div class="message">${message}</div>
    <div class="buttons">
      <button value="yes">はい</button>
      <button value="no">いいえ</button>
    </div>
  `);
}
