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
    const li = ensureElement(focusNode)?.closest('li');
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
        for (const child of safeChildren(next)) {
          ul.append(child);
        }
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
    const li = ensureElement(focusNode)?.closest('li');
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
      for (const sibling of safeSiblings(li.nextSibling)) {
        nextUl.append(sibling);
      }
      // 項目を親の次に移動
      parent.after(li);
      // その次に親の複製を追加
      li.after(nextUl);
    }
    // キャレットのあった位置を復元
    sel.setPosition(focusNode, focusOffset);
    return true;
  },
  // リストの項目を下に移動
  ['alt+ArrowDown']() {
    const sel = getSelection();
    if (!sel?.isCollapsed) {
      // 選択状態では無効
      return false;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const focusElement = ensureElement(focusNode);
    const li = focusElement?.closest('li');
    const parent = li?.parentElement?.closest('ul,ol');
    if (!li || !parent) {
      return false;
    }
    // リストの項目上にキャレットがあればリストの項目を下に移動
    const next = li.nextElementSibling;
    switch (next?.localName) {
      case 'li':
        // 項目の次も項目ならその後ろに移動
        next.after(li);
        break;
      case 'ul':
      case 'ol':
        // 項目の次がリストならその先頭に移動
        next.prepend(li);
        if (li.previousElementSibling?.localName === next.localName) {
          for (const child of safeChildren(next)) {
            li.previousElementSibling.append(child);
          }
          next.remove();
        }
        break;
      case undefined:
        if (
          parent.parentElement &&
          ['ul', 'ol'].includes(parent.parentElement.localName)
        ) {
          // 項目が一番最後で親の親がリストなら親の後ろに移動
          parent.after(li);
          if (!parent.firstElementChild) {
            // 親が空っぽになったら削除
            parent.remove();
          }
        }
    }
    // キャレットのあった位置を復元
    sel.setPosition(focusNode, focusOffset);
    return true;
  },
  // リストの項目を上に移動/テーブルのセル間移動
  ['alt+ArrowUp']() {
    const sel = getSelection();
    if (!sel?.isCollapsed) {
      // 選択状態では無効
      return false;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const focusElement = ensureElement(focusNode);
    const li = focusElement?.closest('li');
    const parent = li?.parentElement?.closest('ul,ol');
    if (!li || !parent) {
      return false;
    }
    // リストの項目上にキャレットがあればリストの項目を上に移動
    const prev = li.previousElementSibling;
    switch (prev?.localName) {
      case 'li':
        // 項目の前も項目ならその前に移動
        prev.before(li);
        break;
      case 'ul':
      case 'ol':
        // 項目の前がリストならその末尾に移動
        prev.append(li);
        break;
      case undefined:
        if (
          parent.parentElement &&
          ['ul', 'ol'].includes(parent.parentElement.localName)
        ) {
          // 項目が一番先頭で親の親がリストなら親の前に移動
          parent.before(li);
          if (!parent.firstElementChild) {
            // 親が空っぽになったら削除
            parent.remove();
          }
        }
        break;
    }
    // キャレットのあった位置を復元
    sel.setPosition(focusNode, focusOffset);
    return true;
  },
  // テーブルのセル間移動
  ['ArrowDown']() {
    const sel = getSelection();
    if (!sel) {
      return false;
    }
    const td = ensureElement(sel.focusNode)?.closest('td,th');
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
        const newTd = document.createElement('td');
        newTr.append(newTd);
        newTd.append(document.createElement('br'));
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
    const td = ensureElement(focusNode)?.closest('td,th');
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
    const td = ensureElement(sel.focusNode)?.closest('td,th');
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
      let localName = row.firstElementChild?.localName;
      if (localName !== 'th' && localName !== 'td') {
        localName = 'td';
      }
      while (index >= row.querySelectorAll(`tr > th, tr > td`).length) {
        const cell = document.createElement(localName);
        cell.append(document.createElement('br'));
        row.append(cell);
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
    const td = ensureElement(sel.focusNode)?.closest('td,th');
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
    const em = ensureElement(sel.focusNode)?.closest('em');
    if (em && em === ensureElement(sel.anchorNode)?.closest('em')) {
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
    ensureElement(sel.focusNode)?.closest(styledLocalName) ||
    ensureElement(sel.anchorNode)?.closest(styledLocalName)
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
  for (const child of safeSiblings(
    startNode,
    endNode?.nextSibling ?? undefined
  )) {
    styled.append(child);
  }
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
    expand(target);
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
  const focusElement = ensureElement(sel.focusNode);
  const td = focusElement?.closest('td,th');
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
          `${ev.ctrlKey ? 'ctrl+' : ''}${ev.altKey ? 'alt+' : ''}${ev.key}`
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
    const sel = getSelection();
    if (!sel) {
      return;
    }
    if (!root.firstChild) {
      // contentBoxが空になったら<div><br></div>を挿入
      const div = document.createElement('div');
      const br = document.createElement('br');
      root.append(div);
      div.append(br);
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
      const element = asElement(node);
      if (!element) {
        continue;
      }
      switch (element.localName) {
        case 'div':
        case 'li':
          {
            const br = element.querySelector('br:first-child:last-child');
            BLOCK: if (br) {
              for (
                let ancestor = br.parentElement;
                ancestor && ancestor !== element;
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
                  ].includes(ancestor.localName)
                ) {
                  break BLOCK;
                }
              }
              // div/liが文字装飾要素だけのbrを子孫に持つ場合はbrだけを残す
              element.firstChild?.replaceWith(br);
            }
          }
          break;
        case 'a':
          {
            // aタグはhref以外の属性を除去
            for (const {localName} of element.attributes) {
              if (localName === 'href') {
                continue;
              }
              element.removeAttribute(localName);
            }
            // styleはattributesに並ばないので特別扱い
            element.removeAttribute('style');
          }
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'pre':
          if (element.firstChild === element.lastChild) {
            const child = asElement(element.firstChild);
            if (child?.localName === 'br') {
              // h*、preがbr要素1つだけを子に持つ場合はdivに差し替え
              const div = document.createElement('div');
              div.append(document.createElement('br'));
              element.replaceWith(div);
              sel.setPosition(div, 0);
            }
          }
          break;
        case 'span':
        case 'i':
        case 'font':
          // span,i,fontは使わないので展開
          expand(element);
          break;
        case 'br':
          if (element.parentElement === root) {
            // ルート直下にあるbrはdivタグの中に入れる
            const div = document.createElement('div');
            element.replaceWith(div);
            div.append(element);
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
      if (
        target.previousSibling &&
        asElement(target.previousSibling)?.localName !== 'br'
      ) {
        continue;
      }
      if (target.data === '|||' && !target.nextSibling) {
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        const headerLine = document.createElement('tr');
        const header1 = document.createElement('th');
        const header2 = document.createElement('th');
        const dataLine = document.createElement('tr');
        const data1 = document.createElement('td');
        const data2 = document.createElement('td');
        header1.textContent = 'Header1';
        header2.textContent = 'Header2';
        data1.textContent = 'Data1';
        data2.textContent = 'Data2';
        tbody.append(headerLine);
        headerLine.append(header1);
        headerLine.append(header2);
        tbody.append(dataLine);
        dataLine.append(data1);
        dataLine.append(data2);
        table.append(tbody);
        target.replaceWith(table);
        sel.setPosition(header1, 0);
        continue;
      }
      if (target.data === '```' && !target.nextSibling) {
        const pre = document.createElement('pre');
        pre.textContent = '\n';
        target.replaceWith(pre);
        continue;
      }
      if (target.data === '---' && !target.nextSibling) {
        const hr = document.createElement('hr');
        target.replaceWith(hr);
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
        for (const sibling of safeSiblings(nextSibling)) {
          li.append(sibling);
        }
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
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        if (target.data.charAt(1) === 'x') {
          checkbox.setAttribute('checked', 'true');
        }
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
    attributeOldValue: true,
    characterDataOldValue: true,
  });
}
