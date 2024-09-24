function* safeChildren(parent: Element | null) {
  if (!parent) {
    return;
  }
  yield* safeSiblings(parent.firstChild);
}

function* safeSiblings(first: Node | null, last?: Node) {
  for (
    let sibling = first, next: Node | null;
    sibling && sibling !== last;
    sibling = next
  ) {
    next = sibling.nextSibling;
    yield sibling;
  }
}
function prepareSurroundStyledText() {
  const sel = getSelection()!;
  if (sel.isCollapsed || sel.rangeCount !== 1) {
    // 選択していない、もしくは複数選択していれば無効
    return;
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
    next: (node: Node) => Node | null,
    containerChild?: Node
  ): [Element, Node?] => {
    if (offsetInRange) {
      return [target.parentElement!, target];
    }
    for (
      let element = target.parentElement;
      element && element !== commonAncestorContainer;
      element = element.parentElement
    ) {
      for (let sibling = next(element); sibling; sibling = next(sibling)) {
        if (
          asText(sibling)?.data.match(/\S/) ||
          sibling.nodeType === Node.ELEMENT_NODE
        ) {
          return [element.parentElement!, element];
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
  const [startElement, startNode] = elementAndNode(
    startContainer,
    startInText,
    node => node.previousSibling,
    commonAncestorContainer.firstChild!
  );
  const [endElement, endNode] = elementAndNode(
    endContainer,
    endInText,
    node => node.nextSibling
  );
  if (startElement !== endElement) {
    // まとめて1つの要素に移動できない親子関係の場合は無効
    return;
  }
  return {
    container: startElement,
    startNode,
    startOffset,
    startInText,
    endNode,
    endOffset,
    endInText,
  };
}

function surroundStyledText(
  selection: NonNullable<ReturnType<typeof prepareSurroundStyledText>>,
  styledLocalName: string
) {
  let {
    startNode,
    startOffset,
    startInText,
    endNode,
    endOffset,
    endInText,
  } = selection;
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
  (asElement(endNode) ?? asText(endNode))?.after(styled);
  for (const child of safeSiblings(
    startNode!,
    endNode?.nextSibling ?? undefined
  )) {
    styled.append(child);
  }
  getSelection()?.setBaseAndExtent(
    styled.firstChild!,
    0,
    styled.lastChild!,
    (styled.lastChild as Text).data.length
  );
}

const keymap: Record<
  string,
  (root: HTMLDivElement, ev: KeyboardEvent) => void
> = {
  // リストのレベルを深くする
  ['ctrl+]']() {
    const sel = getSelection();
    if (!sel?.isCollapsed) {
      // 選択状態では無効
      return;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const li = ensureElement(focusNode)?.closest('li');
    if (!li) {
      // リストの項目上にキャレットがなければ無効
      return;
    }
    const {
      previousElementSibling: prev,
      nextElementSibling: next,
      parentElement: parent,
    } = li;
    if (!['ul', 'ol'].includes(parent!.localName)) {
      // リストの項目の親がul/olでなければ無効
      return;
    }
    let ul;
    if (['ul', 'ol'].includes(prev?.localName ?? '')) {
      // 項目の前がリストならそのリストに追加
      ul = prev!;
      ul.append(li);
    } else {
      // でなければ項目があった場所に新しいリストを追加して移動
      ul = document.createElement(parent!.localName);
      li.after(ul);
      ul.append(li);
    }
    if (next?.localName === ul.localName) {
      // 項目の次が同じ種類のリストならそのリストの項目を移動して削除
      for (const child of safeChildren(next)) {
        ul.append(child);
      }
      next.remove();
    }
    // キャレットのあった位置を復元
    sel.setPosition(focusNode, focusOffset);
  },
  // リストのレベルを浅くする
  ['ctrl+[']() {
    const sel = getSelection()!;
    if (!sel.isCollapsed) {
      // 選択状態では無効
      return;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const li = ensureElement(focusNode)?.closest('li');
    if (!li) {
      // リストの項目上にキャレットがなければ無効
      return;
    }
    const parent = li.parentElement?.closest('ul,ol');
    const grandParent = parent?.parentElement?.closest('ul,ol');
    if (!parent || !grandParent) {
      // リストの項目の親がul/olで更にその親もul/olでなければ無効
      return;
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
  },
  // リストの項目を下に移動
  ['alt+ArrowDown']() {
    const sel = getSelection()!;
    if (!sel.isCollapsed) {
      // 選択状態では無効
      return;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const focusElement = ensureElement(focusNode);
    const li = focusElement?.closest('li');
    const parent = li?.parentElement?.closest('ul,ol');
    if (!li || !parent) {
      return;
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
  },
  // リストの項目を上に移動/テーブルのセル間移動
  ['alt+ArrowUp']() {
    const sel = getSelection()!;
    if (!sel.isCollapsed) {
      // 選択状態では無効
      return;
    }
    // キャレットの位置を記憶
    const {focusNode, focusOffset} = sel;
    const focusElement = ensureElement(focusNode);
    const li = focusElement?.closest('li');
    const parent = li?.parentElement?.closest('ul,ol');
    if (!li || !parent) {
      return;
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
  },
  // テーブルのセル間移動
  ['ctrl+ArrowDown'](_, ev) {
    const focusNode = getSelection()!.focusNode;
    const focusElement = ensureElement(focusNode);
    const td = focusElement?.closest('td,th');
    const tr = td?.closest('tr');
    if (td && tr) {
      ev.preventDefault();
      // テーブルのセル上にキャレットがあれば下のセルにキャレット移動
      const cells = tr.querySelectorAll(`tr > ${td.localName}`);
      const index = indexOf(cells, td) ?? 0;
      const nextRow = tr.nextElementSibling;
      if (nextRow) {
        const nextTd = nextRow.querySelector(
          `td:nth-of-type(${index + 1}), th:nth-of-type(${index + 1})`
        );
        getSelection()!.setPosition(nextTd?.firstChild ?? null, 0);
      } else {
        const newTr = document.createElement('tr');
        tr.parentElement!.append(newTr);
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
        getSelection()!.setPosition(focusCell?.firstChild ?? null, 0);
      }
    }
  },
  // テーブルのセル間移動
  ['ctrl+ArrowUp'](_, ev) {
    const focusNode = getSelection()!.focusNode;
    const focusElement = ensureElement(focusNode);
    const td = focusElement?.closest('td,th');
    if (td) {
      ev.preventDefault();
      // テーブルのセル上にキャレットがあれば上のセルにキャレット移動
      const tr = td.closest('tr');
      const prevRow = tr?.previousElementSibling;
      if (prevRow) {
        const index =
          indexOf(tr.querySelectorAll(`tr > ${td.localName}`), td) ?? 0;
        const prevTd = prevRow.querySelector(
          `td:nth-of-type(${index + 1}),th:nth-of-type(${index + 1})`
        );
        getSelection()?.setPosition(prevTd?.firstChild ?? null, 0);
      }
    }
  },
  // テーブルのセル間移動
  ['ctrl+ArrowRight'](_, ev) {
    const focusNode = getSelection()!.focusNode;
    const focusElement = ensureElement(focusNode);
    const td = focusElement?.closest('td,th');
    if (td) {
      ev.preventDefault();
      // テーブルのセル上にキャレットがあれば右のセルにキャレット移動
      let nextCell = td.nextElementSibling;
      if (!nextCell) {
        const tr = td.closest('tr');
        const table = tr?.closest('table');
        const index = tr?.querySelectorAll(`tr > ${td.localName}`).length ?? 0;
        for (const row of table?.querySelectorAll('tr') ?? []) {
          const localName = row.querySelector('td,th')!.localName;
          while (index >= row.querySelectorAll(`tr > th, tr > td`).length) {
            const cell = document.createElement(localName);
            row.append(cell);
            cell.append(document.createElement('br'));
          }
        }
        nextCell = td.nextElementSibling;
      }
      getSelection()!.setPosition(nextCell?.firstChild ?? null, 0);
    }
  },
  // テーブルのセル間移動
  ['ctrl+ArrowLeft'](_, ev) {
    const focusNode = getSelection()!.focusNode;
    const focusElement = ensureElement(focusNode);
    const td = focusElement?.closest('td,th');
    if (td) {
      ev.preventDefault();
      // テーブルのセル上にキャレットがあれば左のセルにキャレット移動
      const prevCell = td.previousElementSibling;
      if (prevCell) {
        getSelection()!.setPosition(prevCell.firstChild, 0);
      }
    }
  },
  // テーブルのセル削除
  Delete(root, ev) {
    if (deleteStyledElement(false) || deleteTableCell(root, false)) {
      ev.preventDefault();
    };
  },
  Backspace(root, ev) {
    if (deleteStyledElement(true) || deleteTableCell(root, true)) {
      ev.preventDefault();
    };
  },
  // Undo
  ['ctrl+z'](_, ev) {
    ev.preventDefault();
    // 編集履歴はブラウザの履歴として残っているので戻るとUndoになる
    history.back();
  },
  // Redo
  ['ctrl+y'](_, ev) {
    ev.preventDefault();
    // 編集履歴はブラウザの履歴として残っているので進むとRedoになる
    history.forward();
  },
  // 強調/強い強調
  ['*'](_, ev) {
    const selection = prepareSurroundStyledText();
    if (!selection) {
      // まとめて1つの要素に移動できない親子関係の場合は無効
      return;
    }
    if (selection.container?.closest('strong')) {
      // すでに強い強調が設定されていたら無効
      return;
    }
    // 標準のキー入力処理はキャンセル
    ev.preventDefault();
    {
      // *は1文字で強調(em)、2文字で強い強調(strong)になるため、すでに強調が設定されている場合は強い強調に置き換える
      const em = selection.container?.closest('em');
      if (em) {
        // emの子をstrongに移動する
        const strong = document.createElement('strong');
        for (const child of safeChildren(em)) {
          strong.append(child);
        }
        // emをstrongに置き換え
        em.replaceWith(strong);
        // strongの先頭から末尾までを選択
        getSelection()!.setBaseAndExtent(
          strong.firstChild!,
          0,
          strong.lastChild!,
          (strong.lastChild as Text).data.length
        );
        return;
      }
    }
    // 選択範囲をemに入れる
    surroundStyledText(selection, 'em');
  },
  // 取り消し線
  ['~'](_, ev) {
    const selection = prepareSurroundStyledText();
    if (!selection) {
      // まとめて1つの要素に移動できない親子関係の場合は無効
      return;
    }
    if (selection.container?.closest('strike')) {
      // すでに取り消し線が設定されていたら無効
      return;
    }
    // 標準のキー入力処理はキャンセル
    ev.preventDefault();
    // 選択範囲をstrikeに入れる
    surroundStyledText(selection, 'strike');
  },
  // コード
  ['`'](_, ev) {
    const selection = prepareSurroundStyledText();
    if (!selection) {
      // まとめて1つの要素に移動できない親子関係の場合は無効
      return;
    }
    if (selection.container?.closest('code')) {
      // すでにコードが設定されていたら無効
      return;
    }
    // 標準のキー入力処理はキャンセル
    ev.preventDefault();
    // 選択範囲をcodeに入れる
    surroundStyledText(selection, 'code');
  },
};

function deleteStyledElement(goBackword: boolean) {
  const sibling = goBackword ? 'previousSibling' : 'nextSibling';
  const {isCollapsed, focusNode, focusOffset} = getSelection()!;
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
  const target = ['em', 'strong', 'strike', 'code'].includes(
    asElement(focusNode?.[sibling])?.localName ?? ''
  )
    ? (focusNode![sibling] as Element)
    : !focusNode?.[sibling] &&
      ['em', 'strong', 'strike', 'code'].includes(
        focusNode?.parentElement?.localName ?? ''
      )
    ? focusNode!.parentElement!
    : undefined;
  if (!target) {
    return false;
  }
  let parent: Element | undefined;
  if (target.localName === 'strong') {
    const em = document.createElement('em');
    for (const child of safeChildren(target)) {
      em.append(child);
    }
    target.replaceWith(em);
  } else {
    parent = target.parentElement!;
    for (const child of safeChildren(target)) {
      target.before(child);
    }
    target.remove();
  }

  getSelection()?.setPosition(focusNode, focusOffset);
  parent?.normalize();
  return true;
}

function deleteTableCell(root: HTMLDivElement, goBackword: boolean) {
  const focusElement = ensureElement(getSelection()!.focusNode);
  const td = focusElement?.closest('td,th');
  if (!td) {
    return false;
  }
  const br = asElement(td.firstChild);
  if (br?.localName !== 'br'){
    return false;
  }
  if (br.nextSibling) {
    return false;
  }
  const tr = td.closest('tr');
  const table = tr?.closest('table');
  const forwardFocusNode = td.nextElementSibling?.firstChild ??
    tr?.nextElementSibling?.querySelector('td:first-child,th:first-child')
      ?.firstChild ??
    table?.nextElementSibling?.firstChild;
  const backwardFocusNode = td.previousElementSibling?.lastChild ??
    tr?.previousElementSibling?.querySelector('td:last-child,th:last-child')
      ?.lastChild ??
    table?.previousElementSibling?.lastChild;
  const focusNode = goBackword
    ?
    // Backspaceの場合は削除後のキャレット位置が逆
    backwardFocusNode ?? forwardFocusNode ?? root
    :
    forwardFocusNode ?? backwardFocusNode ?? root;
    const focusOffset = focusNode === backwardFocusNode
    ? (focusNode as Text).data?.length ?? 0
    : 0;
  td.remove();
  if (tr && !tr.firstChild) {
    tr.remove();
    if (table && !table.querySelector('tr')) {
      table.remove();
    }
  }
  getSelection()!.setPosition(focusNode, focusOffset);
  return true;
}

async function prepareEditor(root: HTMLDivElement) {
  document.addEventListener(
    'keydown',
    ev =>
      keymap[
        `${ev.ctrlKey ? 'ctrl+' : ''}${ev.altKey ? 'alt+' : ''}${ev.key}`
      ]?.(root, ev),
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
    if (!root.firstChild) {
      // contentBoxが空になったら<div><br></div>を挿入
      const div = document.createElement('div');
      const br = document.createElement('br');
      root.append(div);
      div.append(br);
      // 挿入したdivにキャレットを移す
      getSelection()!.setPosition(root.firstChild, 0);
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
      mutations.flatMap(({type, addedNodes}) =>
        type === 'childList' ? [...addedNodes] : []
      )
    )) {
      const element = asElement(node);
      if (!element) {
        continue;
      }
      switch (element.localName) {
        case 'li':
          if (element.firstChild === element.lastChild) {
            const child = asElement(element.firstChild);
            const grandChild = asElement(child?.firstChild);
            if (
              child?.firstChild === child?.lastChild &&
              grandChild?.localName === 'br'
            ) {
              // 要素1つだけを子に持っていて、その子がbrだけを子に持つ場合はbrだけを残す
              child!.replaceWith(grandChild);
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
              getSelection()!.setPosition(div, 0);
            }
          }
          break;
        case 'span':
          // spanは使わないのでその子をspanの次に移動してspanは削除
          for (const child of safeChildren(element)) {
            element.after(child);
          }
          element.remove();
          break;
        case 'br':
          if (element.parentElement === root) {
            // ルート直下にあるbrはdivタグの中に入れる
            const div = document.createElement('div');
            element.replaceWith(div);
            div.append(element);
            getSelection()!.setPosition(div, 0);
          }
          break;
      }
    }
    for (const {type, target: _target} of mutations) {
      if (type !== 'characterData') {
        continue;
      }
      const target = _target as Text;
      let parent =
        target.parentElement ??
        (mutations.find(
          m =>
            m.type === 'childList' &&
            indexOf(m.removedNodes, target) !== undefined
        )?.target as Element);
      if (!parent) {
        break;
      }
      if (parent === root) {
        const div = document.createElement('div');
        target.replaceWith(div);
        div.append(target);
        parent = div;
      }
      if (['div', 'li'].includes(parent.localName)) {
        if (target.data === '|||') {
          const table = document.createElement('table');
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
          table.append(headerLine);
          headerLine.append(header1);
          headerLine.append(header2);
          table.append(dataLine);
          dataLine.append(data1);
          dataLine.append(data2);
          parent.replaceWith(table);
          getSelection()!.setPosition(header1, 0);
          break;
        }
        if (target.data === '```') {
          const pre = document.createElement('pre');
          pre.textContent = '\n';
          parent.replaceWith(pre);
          break;
        }
        if (target.data === '---') {
          const hr = document.createElement('hr');
          target.data = '';
          parent.before(hr);
          break;
        }
        let match = /^(?:-|1\.)[ \xa0]/s.exec(target.data);
        if (match && parent.firstChild === target) {
          const [prefix] = match;
          const data = target.data.slice(prefix.length);
          const {focusNode, focusOffset = 0} = getSelection() ?? {};
          const ul = document.createElement(
            target.data.charAt(0) === '-' ? 'ul' : 'ol'
          );
          const li = document.createElement('li');
          ul.append(li);
          if (!data && !target.nextSibling) {
            const br = document.createElement('br');
            li.append(br);
          } else {
            target.data = data;
            const {nextSibling} = target;
            li.append(target);
            for (const sibling of safeSiblings(nextSibling)) {
              li.append(sibling);
            }
          }
          parent.replaceWith(ul);
          if (focusNode === target) {
            getSelection()?.setPosition(
              li.firstChild,
              focusOffset - prefix.length
            );
          }
          break;
        }
        if (
          /^\[[x ]\][ \xa0]/.test(target.data) &&
          parent.localName === 'li' &&
          parent.parentElement?.localName === 'ul'
        ) {
          const sel = getSelection()!;
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
          break;
        }
      }
    }
    {
      // 見出し用要素の切り替え
      const {anchorNode, anchorOffset, focusNode, focusOffset} =
        getSelection()!;
      let modified;
      for (const div of document.querySelectorAll('#contentBox > *')) {
        if (!/^(?:h([12345])|div)$/.test(div.localName)) {
          continue;
        }
        const current = Number(div.localName.charAt(1)) || 0;
        const actual =
          (div.firstChild?.nodeType === Node.TEXT_NODE &&
            /^#{1,5}(?=[ \xa0])/.exec((div.firstChild as Text).data)?.[0]
              .length) ||
          0;
        if (current === actual) {
          continue;
        }
        const head = document.createElement(actual ? `h${actual}` : 'div');
        for (const child of safeChildren(div)) {
          head.append(child);
        }
        div.replaceWith(head);
        modified = true;
      }
      if (modified) {
        // キャレットのあるノード自体は変化していないがノードの位置が変更になっているので設定し直す
        getSelection()!.setBaseAndExtent(
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
