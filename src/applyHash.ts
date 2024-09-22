async function applyHash() {
  const encoded = location.hash.slice(1);
  contentBox.innerHTML = encoded
    ? await decodeHash(encoded)
    : `<h1># [${formatDate('YYYY-MM-DD hh:mm')}] memo</h1><div><br></div>`;
  applyFocusInfo();
  contentBox.focus();
}
