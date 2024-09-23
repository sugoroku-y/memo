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
  const [startElement, startNode] = (() => {
    if (startContainer === commonAncestorContainer || startOffset > 0) {
      return [startContainer.parentElement, startContainer];
    }
    for (
      let element = startContainer.parentElement;
      element && element !== commonAncestorContainer;
      element = element.parentElement
    ) {
      for (
        let sibling = element.previousSibling;
        sibling;
        sibling = sibling.previousSibling
      ) {
        if (
          asText(sibling)?.data.match(/\S/) ||
          sibling.nodeType === Node.ELEMENT_NODE
        ) {
          return [element.parentElement, element];
        }
      }
    }
    return [
      commonAncestorContainer as Element,
      commonAncestorContainer.firstChild,
    ];
  })();
  const [endElement, endNode] = (() => {
    if (
      endContainer === commonAncestorContainer ||
      endOffset < (endContainer as Text).data.length
    ) {
      return [endContainer.parentElement, endContainer];
    }
    for (
      let element = endContainer.parentElement;
      element && element !== commonAncestorContainer;
      element = element.parentElement
    ) {
      for (
        let sibling = element.nextSibling;
        sibling;
        sibling = sibling.nextSibling
      ) {
        switch (sibling.nodeType) {
          case Node.TEXT_NODE:
            if (/\S/.test((sibling as Text).data)) {
              return [element.parentElement, element];
            }
            break;
          case Node.ELEMENT_NODE:
            return [element.parentElement, element];
        }
      }
    }
    return [commonAncestorContainer as Element, undefined];
  })();
  if (startElement !== endElement) {
    // まとめて1つの要素に移動できない親子関係の場合は無効
    return;
  }
  return {
    container: startElement,
    startNode,
    startOffset,
    startInText: startContainer === commonAncestorContainer || startOffset > 0,
    endNode,
    endOffset,
    endInText:
      endContainer === commonAncestorContainer ||
      endOffset < (endNode as Text).data?.length,
  };
}

function surroundStyledText(
  selection: NonNullable<ReturnType<typeof prepareSurroundStyledText>>,
  styledLocalName: string
) {
  let {
    container,
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
  container?.insertBefore(styled, endNode?.nextSibling ?? null);
  for (const child of safeSiblings(
    startNode!,
    endNode?.nextSibling ?? undefined
  )) {
    styled.appendChild(child);
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
    const ul = ['ul', 'ol'].includes(prev?.localName ?? '')
      ? (prev as Element)
      : document.createElement(parent!.localName);
    ul.appendChild(li);
    if (ul !== prev) {
      parent!.insertBefore(ul, next);
    }
    if (next?.localName === ul.localName) {
      for (let child = next.firstChild, n; child; child = n) {
        n = child.nextSibling;
        ul.appendChild(child);
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
      grandParent.insertBefore(li, parent);
      if (!parent.firstElementChild) {
        // 親が空っぽになったら削除
        parent.remove();
      }
    } else if (parent.lastElementChild === li) {
      // 現在の項目が親の末尾であれば親の後ろに移動
      grandParent.insertBefore(li, parent.nextSibling);
      if (!parent.firstElementChild) {
        // 親が空っぽになったら削除
        parent.remove();
      }
    } else {
      // 親の複製に自分の後ろの兄弟を移動
      const nextUl = document.createElement(parent.localName);
      for (const sibling of safeSiblings(li.nextSibling)) {
        nextUl.appendChild(sibling);
      }
      // 項目を親の次に移動
      grandParent.insertBefore(li, parent.nextSibling);
      // その次に親の複製を追加
      grandParent.insertBefore(nextUl, li.nextSibling);
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
        parent.insertBefore(li, next.nextSibling);
        break;
      case 'ul':
      case 'ol':
        // 項目の次がリストならその先頭に移動
        next.insertBefore(li, next.firstChild);
        break;
      case undefined:
        if (
          parent.parentElement &&
          ['ul', 'ol'].includes(parent.parentElement.localName)
        ) {
          // 項目が一番最後で親の親がリストなら親の後ろに移動
          parent.parentElement.insertBefore(li, parent.nextSibling);
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
        parent.insertBefore(li, prev);
        break;
      case 'ul':
      case 'ol':
        // 項目の前がリストならその末尾に移動
        prev.appendChild(li);
        break;
      case undefined:
        if (
          parent.parentElement &&
          ['ul', 'ol'].includes(parent.parentElement.localName)
        ) {
          // 項目が一番先頭で親の親がリストなら親の前に移動
          parent.parentElement.insertBefore(li, parent);
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
        [ 'ctrl+ArrowDown'](_,ev){
            const focusNode = getSelection()!.focusNode;
            const focusElement = ensureElement(focusNode);
            const td = focusElement?.closest('td,th');
            const tr = td?.closest('tr');
            if (td && tr) {
              ev.preventDefault();
              // テーブルのセル上にキャレットがあれば下のセルにキャレット移動
              const cells = tr.querySelectorAll(`tr > ${td.localName}`);
              const index = cells.entries().find(([, e]) => e === td)?.[0] ?? 0;
              const nextRow = tr.nextElementSibling;
              if (nextRow) {
                const nextTd = nextRow.querySelector(
                  `td:nth-of-type(${index + 1}), th:nth-of-type(${index + 1})`
                );
                getSelection()!.setPosition(nextTd?.firstChild ?? null, 0);
              } else {
                const newTr = tr.parentElement!.appendChild(
                  document.createElement('tr')
                );
                const cellCount = cells.length;
                let focusCell;
                for (let i = 0; i < cellCount; ++i) {
                  const newTd = newTr.appendChild(document.createElement('td'));
                  newTd.appendChild(document.createElement('br'));
                  if (i === index) {
                    focusCell = newTd;
                  }
                }
                getSelection()!.setPosition(focusCell?.firstChild ?? null, 0);
              }
            }
          },
        // テーブルのセル間移動
        [ 'ctrl+ArrowUp'](_, ev){
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
                  tr
                    .querySelectorAll(`tr > ${td.localName}`)
                    .entries()
                    .find(([, e]) => e === td)?.[0] ?? 0;
                const prevTd = prevRow.querySelector(
                  `td:nth-of-type(${index + 1}),th:nth-of-type(${index + 1})`
                );
                getSelection()?.setPosition(prevTd?.firstChild ?? null, 0);
              }
            }
          },
        // テーブルのセル間移動
         ['ctrl+ArrowRight'](_,ev){
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
                const index =
                  tr?.querySelectorAll(`tr > ${td.localName}`).length ?? 0;
                for (const row of table?.querySelectorAll('tr') ?? []) {
                  const localName = row.querySelector('td,th')!.localName;
                  while (
                    index >= row.querySelectorAll(`tr > th, tr > td`).length
                  ) {
                    const cell = row.appendChild(
                      document.createElement(localName)
                    );
                    cell.appendChild(document.createElement('br'));
                  }
                }
                nextCell = td.nextElementSibling;
              }
              getSelection()!.setPosition(nextCell?.firstChild ?? null, 0);
            }
          },
        // テーブルのセル間移動
        [ 'ctrl+ArrowLeft'](_,ev)
          {
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
          this.Backspace(root, ev)
        },
        Backspace(root, ev){
            const focusNode = getSelection()!.focusNode;
            const focusElement = ensureElement(focusNode);
            const td = focusElement?.closest('td,th');
            if (
              td &&
              asElement(td.firstChild)?.localName === 'br' &&
              td.firstChild!.nextSibling == null
            ) {
              // 空のセル上にキャレットがあればセルを削除
              ev.preventDefault();
              const tr = td.closest('tr');
              const table = tr?.closest('table');
              const forwardFocusNode =
                td.nextElementSibling?.firstChild ??
                tr?.nextElementSibling?.querySelector(
                  'td:first-child,th:first-child'
                )?.firstChild ??
                table?.nextElementSibling?.firstChild;
              const backwardFocusNode =
                td.previousElementSibling?.lastChild ??
                tr?.previousElementSibling?.querySelector(
                  'td:last-child,th:last-child'
                )?.lastChild ??
                table?.previousElementSibling?.lastChild;
              const focusNode =
                ev.key === 'Delete'
                  ? forwardFocusNode ?? backwardFocusNode ?? root
                  : // Backspaceの場合は削除後のキャレット位置が逆
                    backwardFocusNode ?? forwardFocusNode ?? root;
              const focusOffset =
                focusNode === backwardFocusNode
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
            }
          },
        // Undo
  ['ctrl+z'](_,ev) {
    ev.preventDefault();
    // 編集履歴はブラウザの履歴として残っているので戻るとUndoになる
    history.back();
  },
        // Redo
        ['ctrl+y'](_, ev){
          ev.preventDefault();
          // 編集履歴はブラウザの履歴として残っているので進むとRedoになる
          history.forward();
          },
         ['*'](_,ev)
          {
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
                for (const child of safeSiblings(em.firstChild)) {
                  strong.appendChild(child);
                }
                // emをstrongに置き換え
                em.parentElement?.replaceChild(strong, em);
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
        ['~'](_, ev){
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
  ['`'](_,ev){
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
          }
      };
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
      root
        .appendChild(document.createElement('div'))
        .appendChild(document.createElement('br'));
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
      switch (asElement(node)?.localName) {
        case 'li':
          if (node.firstChild === node.lastChild) {
            const child = asElement(node.firstChild);
            const grandChild = asElement(child?.firstChild);
            if (
              child?.firstChild === child?.lastChild &&
              grandChild?.localName === 'br'
            ) {
              // 要素1つだけを子に持っていて、その子がbrだけを子に持つ場合はbrだけを残す
              node.replaceChild(grandChild, child!);
            }
          }
          break;
        case 'a':
          // aタグはhref以外の属性を除去
          for (const {localName} of (node as Element).attributes) {
            if (localName === 'href') {
              continue;
            }
            (node as Element).removeAttribute(localName);
          }
          // styleはattributesに並ばないので特別扱い
          (node as Element).removeAttribute('style');
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'pre':
          if (
            node.firstChild === node.lastChild &&
            node.firstChild?.nodeType === Node.ELEMENT_NODE &&
            (node.firstChild as Element).localName === 'br'
          ) {
            // h*、preがbr要素1つだけを子に持つ場合はdivに差し替え
            const div = document.createElement('div');
            div.appendChild(document.createElement('br'));
            node.parentElement!.replaceChild(div, node);
            getSelection()!.setPosition(div, 0);
          }
          break;
        case 'span':
          {
            // spanは使わないのでその子を親に移動して削除
            const {nextSibling: pos, parentElement: div, firstChild} = node;
            for (const child of safeSiblings(firstChild)) {
              div?.insertBefore(child, pos);
            }
            (node as Element).remove();
          }
          break;
        case 'br':
          if (node.parentElement === root) {
            const div = document.createElement('div');
            root.replaceChild(div, node);
            div.appendChild(node);
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
            m.removedNodes.values().find(e => e === target)
        )?.target as Element);
      if (!parent) {
        break;
      }
      if (parent === root) {
        const div = document.createElement('div');
        root.replaceChild(div, target);
        div.appendChild(target);
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
          table.appendChild(headerLine);
          headerLine.appendChild(header1);
          headerLine.appendChild(header2);
          table.appendChild(dataLine);
          dataLine.appendChild(data1);
          dataLine.appendChild(data2);
          parent.parentElement!.replaceChild(table, parent);
          getSelection()!.setPosition(header1, 0);
          break;
        }
        if (target.data === '```') {
          const pre = document.createElement('pre');
          pre.textContent = '\n';
          parent.parentElement?.replaceChild(pre, parent);
          break;
        }
        if (target.data === '---') {
          const hr = document.createElement('hr');
          target.data = '';
          parent.parentElement?.insertBefore(hr, parent);
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
          ul.appendChild(li);
          if (!data && !target.nextSibling) {
            const br = document.createElement('br');
            li.appendChild(br);
          } else {
            target.data = data;
            const {nextSibling} = target;
            li.appendChild(target);
            for (const sibling of safeSiblings(nextSibling)) {
              li.appendChild(sibling);
            }
          }
          parent.parentElement?.replaceChild(ul, parent);
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
          const {focusNode, focusOffset} = sel;
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          if (target.data.charAt(1) === 'x') {
            checkbox.setAttribute('checked', 'true');
          }
          target.data = target.data.slice(4);
          target.parentElement?.insertBefore(checkbox, target);
          if (focusNode === target) {
            sel.setPosition(focusNode, focusOffset - 4);
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
        for (const child of safeSiblings(div.firstChild)) {
          head.appendChild(child);
        }
        div.parentElement!.replaceChild(head, div);
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

function asText(node: Node | null | undefined): Text | undefined {
  return node?.nodeType === Node.TEXT_NODE ? (node as Text) : undefined;
}

function asElement(node: Node | null | undefined): Element | undefined {
  return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : undefined;
}

function ensureElement(node: Node | null | undefined): Element | undefined {
  return asText(node)?.parentElement ?? asElement(node);
}
