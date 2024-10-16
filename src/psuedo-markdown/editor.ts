let documentId: string | undefined;
let modifiedSinceSaving = false;

const keymap: Record<string, (root: HTMLDivElement) => boolean> = {
  // リストのレベルを深くする
  ['ctrl+]']() {
    const sel = getSelection();
    if (!sel?.isCollapsed) {
      // 選択状態では無効
      return false;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const li = closest(focusNode, 'li');
    if (!li) {
      // リストの項目上にキャレットがなければ無効
      return false;
    }
    const {
      previousElementSibling: prev,
      nextElementSibling: next,
      parentElement: parent,
    } = li;
    if (!parent || !['ul', 'ol'].includes(parent.localName)) {
      // リストの項目の親がul/olでなければ無効
      return false;
    }
    let ul;
    if (prev && ['ul', 'ol'].includes(prev.localName)) {
      // 項目の前がリストならそのリストに追加
      ul = prev;
      ul.append(li);
      if (next && ['ul', 'ol'].includes(next.localName)) {
        // 項目の次がリストならそのリストの項目を移動して削除
        ul.append(...next.childNodes);
        next.remove();
      }
    } else if (next && ['ul', 'ol'].includes(next.localName)) {
      // 項目の後ろがリストならそのリストに追加
      ul = next;
      ul.prepend(li);
    } else {
      // 前後がリストでなければ項目があった場所に新しいリストを追加して移動
      ul = document.createElement(parent.localName);
      li.replaceWith(ul);
      ul.append(li);
    }
    // キャレットのあった位置を復元
    sel.setPosition(focusNode, focusOffset);
    return true;
  },
  // リストのレベルを浅くする
  ['ctrl+[']() {
    const sel = getSelection();
    if (!sel?.isCollapsed) {
      // 選択状態では無効
      return false;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const li = closest(focusNode, 'li');
    if (!li) {
      // リストの項目上にキャレットがなければ無効
      return false;
    }
    const parent = li.parentElement?.closest('ul,ol');
    if (!parent?.parentElement?.closest('ul,ol')) {
      // リストの項目の親がul/olで更にその親もul/olでなければ無効
      return false;
    }
    if (parent.firstElementChild === li) {
      // 現在の項目が親の先頭であれば親の前に移動
      parent.before(li);
      if (!parent.firstElementChild) {
        // 親が空っぽになったら削除
        parent.remove();
      }
    } else if (parent.lastElementChild === li) {
      // 現在の項目が親の末尾であれば親の後ろに移動
      parent.after(li);
      if (!parent.firstElementChild) {
        // 親が空っぽになったら削除
        parent.remove();
      }
    } else {
      // 親の複製に自分の後ろの兄弟を移動
      const nextUl = document.createElement(parent.localName);
      nextUl.append(...safeSiblings(li.nextSibling));
      // 項目を親の次に移動
      parent.after(li);
      // その次に親の複製を追加
      li.after(nextUl);
    }
    // キャレットのあった位置を復元
    sel.setPosition(focusNode, focusOffset);
    return true;
  },
  // 行を下に移動
  ['alt+ArrowDown'](root) {
    return moveLine(root, 'forward');
  },
  // 行を上に移動
  ['alt+ArrowUp'](root) {
    return moveLine(root, 'backword');
  },
  ['shift+alt+ArrowDown']() {
    return copyLine('forward');
  },
  ['shift+alt+ArrowUp']() {
    return copyLine('backword');
  },
  // テーブルのセル間移動
  ['ArrowDown']() {
    const sel = getSelection();
    if (!sel) {
      return false;
    }
    const td = closest(sel.focusNode, 'td,th');
    const tr = td?.closest('tr');
    if (!td || !tr || !tr.parentElement) {
      return false;
    }
    // テーブルのセル上にキャレットがあれば下のセルにキャレット移動
    const cells = tr.querySelectorAll(`tr > ${td.localName}`);
    const index = indexOf(cells, td) ?? 0;
    const nextRow = tr.nextElementSibling;
    if (nextRow) {
      const nextTd = nextRow.querySelector(
        `td:nth-of-type(${index + 1}), th:nth-of-type(${index + 1})`
      );
      sel.setPosition(nextTd?.firstChild ?? null, 0);
    } else {
      const newTr = document.createElement('tr');
      tr.parentElement.append(newTr);
      const cellCount = cells.length;
      let focusCell;
      for (let i = 0; i < cellCount; ++i) {
        const newTd = element('td')`<br>`;
        newTr.append(newTd);
        if (i === index) {
          focusCell = newTd;
        }
      }
      sel.setPosition(focusCell?.firstChild ?? null, 0);
    }
    return true;
  },
  // テーブルのセル間移動
  ['ArrowUp']() {
    const sel = getSelection();
    if (!sel) {
      return false;
    }
    const {focusNode} = sel;
    const td = closest(focusNode, 'td,th');
    if (!td) {
      return false;
    }
    // テーブルのセル上にキャレットがあれば上のセルにキャレット移動
    const tr = td.closest('tr');
    const prevRow = tr?.previousElementSibling;
    if (!prevRow) {
      return false;
    }
    const index = indexOf(tr.querySelectorAll(`tr > ${td.localName}`), td) ?? 0;
    const prevTd = prevRow.querySelector(
      `td:nth-of-type(${index + 1}),th:nth-of-type(${index + 1})`
    );
    sel.setPosition(prevTd?.firstChild ?? null, 0);
    return true;
  },
  // テーブルのセル間移動
  ['ArrowRight']() {
    const sel = getSelection();
    if (!sel?.isCollapsed) {
      return false;
    }
    const td = closest(sel.focusNode, 'td,th');
    if (!td || td.nextSibling) {
      // セル上にキャレットがなければ、もしくはキャレットのあるセルに次のセルがあれば何もしない
      return false;
    }
    const focusText = asText(sel.focusNode);
    const endOffset =
      focusText?.data.length ?? (sel.focusNode?.childNodes.length || 1) - 1;
    // キャレットが末尾になければ何もしない
    if (sel.focusOffset !== endOffset) {
      return false;
    }
    // セルまでの先祖に次のノードが存在していれば何もしない
    for (const ancestor of ancestors(sel.focusNode)) {
      if (ancestor === td) {
        break;
      }
      if (ancestor.nextSibling) {
        return false;
      }
    }
    // テーブル全体を右に拡張
    const tr = td.closest('tr');
    const table = tr?.closest('table');
    const index = tr?.querySelectorAll(`tr > th, tr > td`).length ?? 0;
    for (const row of table?.querySelectorAll('tr') ?? []) {
      // その行の先頭のセルを複製する(なければtd)
      let _localName = row.firstElementChild?.localName;
      const localName =
        _localName === 'th' || _localName === 'td' ? _localName : 'td';
      while (index >= row.querySelectorAll(`tr > th, tr > td`).length) {
        row.append(element(localName)`<br>`);
      }
    }
    // キャレットを次のセルに移動
    const nextCell = td.nextElementSibling;
    if (nextCell) {
      sel.setPosition(nextCell.firstChild ?? nextCell, 0);
    }
    return true;
  },
  // テーブルのセル間移動
  ['ArrowLeft']() {
    const sel = getSelection();
    if (!sel) {
      return false;
    }
    const td = closest(sel.focusNode, 'td,th');
    if (!td || td.previousSibling) {
      // セル上にキャレットがなければ、もしくはキャレットのあるセルに前のセルがあれば何もしない
      return false;
    }
    // キャレットが先頭になければ何もしない
    if (sel.focusOffset !== 0) {
      return false;
    }
    // セルまでの先祖に前のノードが存在していれば何もしない
    for (const ancestor of ancestors(sel.focusNode)) {
      if (ancestor === td) {
        break;
      }
      if (ancestor.previousSibling) {
        return false;
      }
    }
    // 先頭のセルの前には何も存在しないので移動しない
    return true;
  },
  ['ctrl+o']() {
    openDocumentDialog(documentId);
    return true;
  },
  // テーブルのセル削除
  Delete(root) {
    return deleteStyledElement(false) || deleteTableCell(root, false);
  },
  Backspace(root) {
    return deleteStyledElement(true) || deleteTableCell(root, true);
  },
  // Undo
  ['ctrl+z']() {
    // 編集履歴はブラウザの履歴として残っているので戻るとUndoになる
    history.back();
    return true;
  },
  // Redo
  ['ctrl+y']() {
    // 編集履歴はブラウザの履歴として残っているので進むとRedoになる
    history.forward();
    return true;
  },
  // 強調/強い強調
  ['*']() {
    if (!checkSurroundStyledText('strong')) {
      return false;
    }
    const sel = getSelection()!;
    const em = closest(sel.focusNode, 'em');
    if (em && em === closest(sel.anchorNode, 'em')) {
      // 選択範囲の始点と終点が同じem内にあれば強い強調(strong)にさしかえ
      const strong = replace(document.createElement('strong'), em);
      // strongの先頭から末尾までを選択
      sel.selectAllChildren(strong);
      return true;
    }
    // 選択範囲をemに入れる
    return surroundStyledText('em');
  },
  // 取り消し線
  ['~']() {
    if (!checkSurroundStyledText('strike')) {
      return false;
    }
    // 選択範囲をstrikeに入れる
    return surroundStyledText('strike');
  },
  // コード
  ['`']() {
    if (!checkSurroundStyledText('code')) {
      return false;
    }
    // 選択範囲をcodeに入れる
    return surroundStyledText('code');
  },
};

function checkSurroundStyledText(styledLocalName: string) {
  const sel = getSelection();
  if (!sel || sel.isCollapsed) {
    // 選択されていなければ無効
    return false;
  }
  if (
    closest(sel.focusNode, styledLocalName) ||
    closest(sel.anchorNode, styledLocalName)
  ) {
    // すでにstyledLocalNameが設定されていたら無効
    return false;
  }
  return true;
}

function surroundStyledText(styledLocalName: string) {
  const sel = getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount !== 1) {
    // 選択していない、もしくは複数選択していれば無効
    return false;
  }
  let {
    startContainer,
    startOffset,
    endContainer,
    endOffset,
    commonAncestorContainer,
  } = sel.getRangeAt(0);
  const elementAndNode = (
    target: Node,
    offsetInRange: boolean,
    sibling: 'nextSibling' | 'previousSibling',
    containerChild: Node | null | undefined
  ): [Element, Node | null | undefined] => {
    if (offsetInRange && target.parentElement) {
      return [target.parentElement, target];
    }
    for (
      let element = target.parentElement;
      element && element.parentElement && element !== commonAncestorContainer;
      element = element.parentElement
    ) {
      for (
        let siblingNode = element[sibling];
        siblingNode;
        siblingNode = siblingNode[sibling]
      ) {
        if (asText(siblingNode)?.data.match(/\S/) || asElement(siblingNode)) {
          return [element.parentElement, element];
        }
      }
    }
    return [commonAncestorContainer as Element, containerChild];
  };
  const startInText =
    startContainer === commonAncestorContainer || startOffset > 0;
  const endInText =
    endContainer === commonAncestorContainer ||
    endOffset < (endContainer as Text).data?.length;
  let [startElement, startNode] = elementAndNode(
    startContainer,
    startInText,
    'previousSibling',
    commonAncestorContainer.firstChild
  );
  let [endElement, endNode] = elementAndNode(
    endContainer,
    endInText,
    'nextSibling',
    undefined
  );
  if (startElement !== endElement) {
    //     // まとめて1つの要素に移動できない親子関係の場合は無効
    return false;
  }
  const startText = asText(startNode);
  if (startText && startInText) {
    const same = startNode === endNode;
    startNode = startText.splitText(startOffset);
    if (same) {
      endNode = startNode;
      endOffset -= startOffset;
    }
  }
  const endText = asText(endNode);
  if (endText && endInText) {
    endText.splitText(endOffset);
  }
  const styled = document.createElement(styledLocalName);
  (asElement(startNode) ?? asText(startNode))!.before(styled);
  styled.append(...safeSiblings(startNode, endNode?.nextSibling));
  sel.selectAllChildren(styled);
  return true;
}

function deleteStyledElement(goBackword: boolean) {
  const sibling = goBackword ? 'previousSibling' : 'nextSibling';
  const sel = getSelection();
  if (!sel) {
    return false;
  }
  const {isCollapsed, focusNode, focusOffset} = sel;
  if (!isCollapsed) {
    return false;
  }
  const focusText = asText(focusNode);
  if (!focusText) {
    return false;
  }
  const edgeIndex = goBackword ? 0 : focusText.data.length;
  if (focusOffset !== edgeIndex) {
    return false;
  }
  const focusSiblingElement = asElement(focusText[sibling]);
  const target =
    focusSiblingElement &&
    ['em', 'strong', 'strike', 'code'].includes(focusSiblingElement.localName)
      ? focusSiblingElement
      : !focusText[sibling] &&
        focusText.parentElement &&
        ['em', 'strong', 'strike', 'code'].includes(
          focusText.parentElement.localName
        )
      ? focusText.parentElement
      : undefined;
  if (!target) {
    return false;
  }
  let parent: Element | undefined | null;
  if (target.localName === 'strong') {
    replace(document.createElement('em'), target);
  } else {
    parent = target.parentElement;
    target.replaceWith(...target.childNodes);
  }

  sel.setPosition(focusNode, focusOffset);
  parent?.normalize();
  return true;
}

function deleteTableCell(root: HTMLDivElement, goBackword: boolean) {
  const sel = getSelection();
  if (!sel) {
    return false;
  }
  const td = closest(sel.focusNode, 'td,th');
  if (!td) {
    return false;
  }
  const br = asElement(td.firstChild);
  if (br?.localName !== 'br') {
    return false;
  }
  if (br.nextSibling) {
    return false;
  }
  const tr = td.closest('tr');
  const table = tr?.closest('table');
  const forwardFocusNode =
    td.nextElementSibling?.firstChild ??
    tr?.nextElementSibling?.querySelector('td:first-child,th:first-child')
      ?.firstChild ??
    table?.nextElementSibling?.firstChild;
  const backwardFocusNode =
    td.previousElementSibling?.lastChild ??
    tr?.previousElementSibling?.querySelector('td:last-child,th:last-child')
      ?.lastChild ??
    table?.previousElementSibling?.lastChild;
  const focusNode = goBackword
    ? // Backspaceの場合は削除後のキャレット位置が逆
      backwardFocusNode ?? forwardFocusNode ?? root
    : forwardFocusNode ?? backwardFocusNode ?? root;
  const focusOffset =
    focusNode === backwardFocusNode ? (focusNode as Text).data?.length ?? 0 : 0;
  td.remove();
  if (tr && !tr.firstChild) {
    tr.remove();
    if (table && !table.querySelector('tr')) {
      table.remove();
    }
  }
  sel.setPosition(focusNode, focusOffset);
  return true;
}

async function prepareEditor(root: HTMLDivElement) {
  document.addEventListener(
    'keydown',
    ev => {
      const listener =
        keymap[
          `${ev.key.length > 1 && ev.shiftKey ? 'shift+' : ''}${
            ev.ctrlKey ? 'ctrl+' : ''
          }${ev.altKey ? 'alt+' : ''}${ev.key}`
        ];
      if (listener?.(root)) {
        ev.preventDefault();
      }
    },
    true
  );
  root.addEventListener('click', ev => {
    const checkbox = asElement(ev.target as Node)?.closest(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    if (!checkbox) {
      return;
    }
    if (checkbox.checked) {
      checkbox.setAttribute('checked', 'true');
    } else {
      checkbox.removeAttribute('checked');
    }
  });
  new MutationObserver(mutations => {
    if (!documentId) {
      // documentIdが未設定ならドキュメントから取得
      documentId =
        root
          .querySelector('[data-document-id]')
          ?.getAttribute('data-document-id') ??
        // ドキュメントにもなければ乱数によって生成
        [1, 2, 3].map(() => Math.random().toString(36).slice(2)).join('');
      modifiedSinceSaving = false;
    }
    const firstElement = root.firstElementChild;
    if (
      firstElement &&
      firstElement.getAttribute('data-document-id') !== documentId
    ) {
      // 最初の要素のdata-document-id属性がdocumentIdと一致しなければ再設定
      firstElement.setAttribute('data-document-id', documentId);
      for (const holder of root.querySelectorAll('[data-document-id]')) {
        if (holder === firstElement) {
          continue;
        }
        // firstElement以外でdata-document-id属性を持つものは属性を除去
        holder.removeAttribute('data-document-id');
      }
    }
    const sel = getSelection();
    if (!sel) {
      return;
    }
    if (!root.firstChild) {
      // contentBoxが空になったら<div><br></div>を挿入
      root.append(element('div')`<br>`);
      // 挿入したdivにキャレットを移す
      sel.setPosition(root.firstChild, 0);
      return;
    }
    // style属性は使用しないはずなので除去
    for (const {type, target, attributeName} of mutations) {
      if (
        type !== 'attributes' ||
        attributeName !== 'style' ||
        !(target as Element).hasAttribute('style')
      ) {
        continue;
      }
      (target as Element).removeAttribute('style');
    }

    for (const node of new Set(
      (function* () {
        for (const {type, addedNodes} of mutations) {
          if (type !== 'childList') {
            continue;
          }
          yield* addedNodes;
        }
      })()
    )) {
      const elm = asElement(node);
      if (!elm) {
        continue;
      }
      switch (elm.localName) {
        case 'div':
        case 'li':
          {
            const br = elm.querySelector('br:first-child:last-child');
            BLOCK: if (br && !br.previousSibling && !br.nextSibling) {
              for (
                let ancestor = br.parentElement;
                ancestor && ancestor !== elm;
                ancestor = ancestor.parentElement
              ) {
                if (
                  ancestor.previousSibling ||
                  ancestor.nextSibling ||
                  ![
                    'em',
                    'strong',
                    'strike',
                    'code',
                    'span',
                    'i',
                    'font',
                    'pre',
                  ].includes(ancestor.localName)
                ) {
                  break BLOCK;
                }
              }
              // div/liが文字装飾要素だけのbrを子孫に持つ場合はbrだけを残す
              elm.firstChild?.replaceWith(br);
            }
          }
          break;
        case 'a':
          {
            // aタグはhref以外の属性を除去
            for (const {localName} of elm.attributes) {
              if (localName === 'href') {
                continue;
              }
              elm.removeAttribute(localName);
            }
            // styleはattributesに並ばないので特別扱い
            elm.removeAttribute('style');
          }
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'pre':
          if (elm.firstChild === elm.lastChild) {
            const child = asElement(elm.firstChild);
            if (child?.localName === 'br') {
              // h*、preがbr要素1つだけを子に持つ場合はdivに差し替え
              const div = element('div')`<br>`;
              elm.replaceWith(div);
              sel.setPosition(div, 0);
            }
          }
          break;
        case 'span':
        case 'i':
        case 'font':
          // span,i,fontは使わないので展開
          {
            const parent = elm.parentElement;
            elm.replaceWith(...elm.childNodes);
            // 展開することにより隣接するようになったテキストノードを連結
            parent?.normalize();
          }
          break;
        case 'br':
          if (elm.parentElement === root) {
            // ルート直下にあるbrはdivタグの中に入れる
            const div = document.createElement('div');
            elm.replaceWith(div);
            div.append(elm);
            sel.setPosition(div, 0);
          }
          break;
      }
    }
    for (const {type, target: _target} of mutations) {
      if (type !== 'characterData') {
        continue;
      }
      const target = _target as Text;
      let parent = target.parentElement;
      if (!parent) {
        continue;
      }
      if (parent === root) {
        const div = document.createElement('div');
        target.replaceWith(div);
        div.append(target);
        parent = div;
      }
      if (!['div', 'li'].includes(parent.localName)) {
        continue;
      }
      if (!target.isConnected) {
        continue;
      }
      if (!isBeginningOfLine(target)) {
        continue;
      }
      if (target.data === '|||' && isEndOfLine(target)) {
        const table = element('table')/*html*/ `
          <tbody>
            <tr>
              <th>Header1</th>
              <th>Header2</th>
            </tr>
            <tr>
              <td>Data1</td>
              <td>Data2</td>
            </tr>
          </tbody>
        `;
        target.replaceWith(table);
        sel.setPosition(table.querySelector('th'), 0);
        continue;
      }
      if (target.data === '```' && isEndOfLine(target)) {
        const pre = document.createElement('pre');
        pre.textContent = '\n';
        target.replaceWith(pre);
        continue;
      }
      if (target.data === '---' && isEndOfLine(target)) {
        const hr = document.createElement('hr');
        target.before(hr);
        target.data = '';
        if (sel.focusNode === target) {
          sel.setPosition(target, 0);
        }
        continue;
      }
      if (/^(?:-|1\.)[ \xa0]/s.test(target.data)) {
        const isUnordered = target.data.charAt(0) === '-';
        const prefixLength = isUnordered ? 2 : 3;
        const ul = document.createElement(isUnordered ? 'ul' : 'ol');
        const li = document.createElement('li');
        ul.append(li);
        const firstChild = target.splitText(prefixLength);
        const nextSibling = firstChild.nextSibling;
        if (firstChild.data) {
          li.append(firstChild);
        } else {
          firstChild.remove();
        }
        li.append(...safeSiblings(nextSibling));
        if (!li.firstChild) {
          const br = document.createElement('br');
          li.append(br);
        }
        parent.replaceWith(ul);
        if (sel.focusNode === target) {
          sel.setPosition(li.firstChild, sel.focusOffset - prefixLength);
        }
        continue;
      }
      if (
        /^\[[x ]\][ \xa0]/.test(target.data) &&
        parent.localName === 'li' &&
        parent.parentElement?.localName === 'ul'
      ) {
        let {focusNode, focusOffset} = sel;
        const checkbox = element('input', {
          properties: {
            type: 'checkbox',
            checked: target.data.charAt(1) === 'x',
          },
        })``;
        const text = target.splitText(4);
        target.replaceWith(checkbox);
        if (focusNode === target) {
          sel.setPosition(text, Math.max(focusOffset - 4, 0));
        }
        continue;
      }
    }
    {
      // 見出し用要素の切り替え
      const {anchorNode, anchorOffset, focusNode, focusOffset} = sel;
      const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : undefined;
      let modified;
      for (const div of document.querySelectorAll('#contentBox > *')) {
        if (!/^(?:h([12345])|div)$/.test(div.localName)) {
          continue;
        }
        const current = Number(div.localName.charAt(1)) || 0;
        const actual =
          asText(div.firstChild)?.data.match(/^#{1,5}(?=[ \xa0])/)?.[0]
            .length ?? 0;
        if (current === actual) {
          continue;
        }
        if ((range && range.intersectsNode(div)) || div.contains(focusNode)) {
          modified = true;
        }
        replace(document.createElement(actual ? `h${actual}` : 'div'), div);
      }
      if (modified) {
        // キャレットのあるノード自体は変化していないがノードの位置が変更になっているので設定し直す
        sel.setBaseAndExtent(
          anchorNode!,
          anchorOffset,
          focusNode!,
          focusOffset
        );
      }
    }
    document.title = document.querySelector('h1')?.textContent ?? 'untitled';
  }).observe(root, {
    characterData: true,
    childList: true,
    attributes: true,
    subtree: true,
  });

  let inDragging = false;
  root.addEventListener('dragstart', ev => {
    inDragging = true;
    if (ev.dataTransfer?.types.includes('text/html')) {
      const source = document.createElement('div');
      source.innerHTML = ev.dataTransfer.getData('text/html');
      for (const e of source.querySelectorAll('[data-document-id]')) {
        e.removeAttribute('data-document-id');
      }
      for (const e of source.querySelectorAll('h1,h2,h3,h4,h5')) {
        const div = document.createElement('div');
        div.append(...e.childNodes);
        e.replaceWith(div);
      }
      ev.dataTransfer.setData('text/html', source.innerHTML);
    }
  });
  root.addEventListener('dragend', ev => {
    inDragging = false;
  });
  root.addEventListener(
    'dragover',
    ev => {
      if (inDragging) {
        return;
      }
      if (!ev.dataTransfer) {
        return;
      }
      const {types} = ev.dataTransfer;
      if (
        types.includes('Files') ||
        (!types.includes('text.html') && !types.includes('text/plain'))
      ) {
        ev.dataTransfer.effectAllowed = 'none';
        ev.preventDefault();
        return;
      }
    },
    true
  );
  root.addEventListener('drop', ev => {
    if (inDragging) {
      return;
    }
    if (!ev.dataTransfer?.types.includes('text/html')) {
      // html以外はデフォルト処理に回す
      return;
    }
    const sel = getSelection();
    if (!sel) {
      // Selectionが存在しない(FireFoxでiframe内にキャレットがあるときなど)はデフォルト処理
      return;
    }
    const source = document.createElement('div');
    source.innerHTML = ev.dataTransfer.getData('text/html');
    // 余計な属性・要素を除去
    for (const e of source.querySelectorAll('*')) {
      e.removeAttribute('data-document-id');
      e.removeAttribute('style');
      if (
        ![
          // サポート外の要素は除去
          'em',
          'strike',
          'strong',
          'code',
          'pre',
          'a',
          'hr',
          'br',
          'table',
          'tbody',
          'tr',
          'th',
          'td',
          'ul',
          'ol',
          'li',
          'div',
        ].includes(e.localName) ||
        // https以外へのリンクは除去
        (e.localName === 'a' &&
          (!e.hasAttribute('href') ||
            !e.getAttribute('href')?.startsWith('https://')))
      ) {
        e.replaceWith(...e.childNodes);
        continue;
      }
      if (e.localName === 'a') {
        // href以外の属性は除去
        for (const a of e.attributes) {
          if (a.name !== 'href') {
            e.removeAttribute(a.name);
          }
        }
        // スタイル指定は除去
        e.removeAttribute('style');
        // 別タブで開く
        e.setAttribute('target', '_blank');
        // リンク先に不要な情報を渡さない
        e.setAttribute('rel', 'nofollow noopener noreferrer');
        continue;
      }
    }
    // サポート外の要素除去などにより隣接するようになったテキストノードを連結
    source.normalize();
    // ドロップ位置を取得
    const {offset, offsetNode} = document.caretPositionFromPoint?.(
      ev.x,
      ev.y
    ) ?? {
      // caretPositionFromPoint未対応のブラウザではev.targetを使う(未確認)
      offsetNode: ev.target === root ? root.firstChild : (ev.target as Node),
      offset: 0,
    };
    const caretText = asText(offsetNode);
    if (caretText) {
      // ドロップ位置がテキスト内
      const splitted = caretText.splitText(offset);
      splitted.before(...source.childNodes);
      sel.setBaseAndExtent(caretText, offset, splitted, 0);
      ev.dataTransfer.dropEffect = 'copy';
      ev.preventDefault();
      return;
    }
    const caretElement = asElement(offsetNode);
    if (!caretElement) {
      // ドロップ位置が要素でもテキストでもない(ことは多分ないが)ときはデフォルト処理に回す
      return;
    }
    const pos = caretElement.childNodes.item(offset);
    const count = source.childNodes.length;
    if (pos) {
      pos.before(...source.childNodes);
    } else {
      caretElement.append(...source.childNodes);
    }
    sel.setBaseAndExtent(caretElement, offset, caretElement, offset + count);
    ev.dataTransfer.dropEffect = 'copy';
    ev.preventDefault();
  });
}

function moveLine(
  root: HTMLDivElement,
  direction: 'forward' | 'backword'
): boolean {
  const sel = getSelection();
  if (!sel?.isCollapsed) {
    // 選択状態では無効
    return false;
  }
  // キャレットの位置を記憶
  const {focusNode, focusOffset} = sel;
  let line = closest(focusNode, 'li,div,h1,h2,h3,h4,h5,h6');
  if (!line) {
    return false;
  }
  // リストの項目上にキャレットがあればリストの項目を移動
  const parent =
    line.localName === 'li'
      ? line.parentElement?.closest('ul,ol')
      : line.parentElement !== root
      ? line.parentElement
      : undefined;
  const navar =
    line[
      direction === 'forward' ? 'nextElementSibling' : 'previousElementSibling'
    ];
  const against =
    line[
      direction === 'forward' ? 'previousElementSibling' : 'nextElementSibling'
    ];
  switch (navar?.localName) {
    case 'ul':
    case 'ol':
      // 隣がリストならその中に移動
      if (line.localName !== 'li') {
        // リスト項目でなければliに置き換え
        const li = document.createElement('li');
        li.append(...line.childNodes);
        line.remove();
        line = li;
      }
      navar[direction === 'forward' ? 'prepend' : 'append'](line);
      if (against?.localName === navar.localName) {
        // 反対側の隣も同じ種類のリストなら連結
        navar[direction === 'forward' ? 'prepend' : 'append'](
          ...against.childNodes
        );
        against.remove();
      }
      break;
    case undefined:
      // 一番端の項目
      if (!parent) {
        // 親がなければ何もしない
        return false;
      }
      if (
        line.localName === 'li' &&
        (!parent.parentElement ||
          !['ul', 'ol'].includes(parent.parentElement.localName))
      ) {
        // 親の親がリストでなければdivに置き換え
        const div = document.createElement('div');
        div.append(...line.childNodes);
        line.remove();
        line = div;
      }
      // 親の隣に移動
      parent[direction === 'forward' ? 'after' : 'before'](line);
      if (!parent.firstElementChild) {
        // 親が空っぽになったら削除
        parent.remove();
      }

      break;
    default:
      if (navar) {
        // 隣のむこうに移動
        navar[direction === 'forward' ? 'after' : 'before'](line);
      }
      break;
  }
  // キャレットのあった位置を復元
  sel.setPosition(focusNode, focusOffset);
  return true;
}

function copyLine(direction: 'forward' | 'backword'): boolean {
  const sel = getSelection();
  if (!sel?.isCollapsed) {
    // 選択状態では無効
    return false;
  }
  // キャレットの位置を記憶
  const {focusNode, focusOffset} = sel;
  const line = closest(focusNode, 'div,li');
  if (!line) {
    return false;
  }
  line[direction === 'forward' ? 'before' : 'after'](line.cloneNode(true));
  // キャレットのあった位置を復元
  sel.setPosition(focusNode, focusOffset);
  return true;
}

function openHash(hash?: string) {
  const url = hash ? `${location.pathname}#${hash}` : location.pathname;
  documentId = undefined;
  location.replace(url);
}
