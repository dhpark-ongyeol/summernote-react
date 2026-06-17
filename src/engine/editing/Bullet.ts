import lists from '../core/lists';
import func from '../core/func';
import dom from '../core/dom';
import range from '../core/range';

export class Bullet {
  /**
   * toggle ordered list
   */
  insertOrderedList(editable: HTMLElement): void {
    this.toggleList('OL', editable);
  }

  /**
   * toggle unordered list
   */
  insertUnorderedList(editable: HTMLElement): void {
    this.toggleList('UL', editable);
  }

  /**
   * indent
   */
  indent(editable: HTMLElement): void {
    const rng = range.create(editable)!.wrapBodyInlineWithPara();

    const paras = rng.nodes(dom.isPara, { includeAncestor: true });
    const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

    for (const paras of clustereds) {
      const head = lists.head(paras);
      if (dom.isLi(head)) {
        const previousList = this.findList((head as Node).previousSibling);
        if (previousList) {
          paras.map((para) => (previousList as Node).appendChild(para));
        } else {
          this.wrapList(paras, (head as Node).parentNode!.nodeName);
          paras.map((para) => para.parentNode!).map((para) => this.appendToPrevious(para));
        }
      } else {
        for (const para of paras) {
          const el = para as HTMLElement;
          const val = parseInt(getComputedStyle(el).getPropertyValue('margin-left'), 10) || 0;
          el.style.marginLeft = (val + 25) + 'px';
        }
      }
    }

    rng.select();
  }

  /**
   * outdent
   */
  outdent(editable: HTMLElement): void {
    const rng = range.create(editable)!.wrapBodyInlineWithPara();

    const paras = rng.nodes(dom.isPara, { includeAncestor: true });
    const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

    for (const paras of clustereds) {
      const head = lists.head(paras);
      if (dom.isLi(head)) {
        this.releaseList([paras]);
      } else {
        for (const para of paras) {
          const el = para as HTMLElement;
          const val = parseInt(getComputedStyle(el).getPropertyValue('margin-left'), 10) || 0;
          el.style.marginLeft = val > 25 ? ((val - 25) + 'px') : '';
        }
      }
    }

    rng.select();
  }

  /**
   * toggle list
   *
   * @param {String} listName - OL or UL
   */
  toggleList(listName: string, editable?: HTMLElement): void {
    const rng = range.create(editable)!.wrapBodyInlineWithPara();

    let paras = rng.nodes(dom.isPara, { includeAncestor: true });
    const bookmark = rng.paraBookmark(paras);
    const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

    // paragraph to list
    if (lists.find(paras, dom.isPurePara)) {
      let wrappedParas: Node[] = [];
      for (const paras of clustereds) {
        wrappedParas = wrappedParas.concat(this.wrapList(paras, listName));
      }
      paras = wrappedParas;
      // list to paragraph or change list style
    } else {
      const diffLists = rng
        .nodes(dom.isList, {
          includeAncestor: true,
        })
        .filter((listNode) => {
          return (listNode.nodeName !== listName);
        });

      if (diffLists.length) {
        for (const listNode of diffLists) {
          dom.replace(listNode, listName);
        }
      } else {
        paras = this.releaseList(clustereds, true);
      }
    }

    range.createFromParaBookmark(bookmark, paras).select();
  }

  /**
   * @param {Node[]} paras
   * @param {String} listName
   * @return {Node[]}
   */
  wrapList(paras: Node[], listName?: string): Node[] {
    const head = lists.head(paras);
    const last = lists.last(paras);

    const prevList = dom.isList(head.previousSibling) && head.previousSibling;
    const nextList = dom.isList(last.nextSibling) && last.nextSibling;

    const listNode = (prevList as Node) || dom.insertAfter(dom.create(listName || 'UL'), last);

    // P to LI
    paras = paras.map((para) => {
      return dom.isPurePara(para) ? dom.replace(para, 'LI') : para;
    });

    // append to list(<ul>, <ol>)
    dom.appendChildNodes(listNode, paras, true);

    if (nextList) {
      dom.appendChildNodes(listNode, lists.from((nextList as Node).childNodes), true);
      dom.remove(nextList as Node);
    }

    return paras;
  }

  /**
   * @method releaseList
   *
   * @param {Array[]} clustereds
   * @param {Boolean} isEscapseToBody
   * @return {Node[]}
   */
  releaseList(clustereds: Node[][], isEscapseToBody?: boolean): Node[] {
    let releasedParas: Node[] = [];

    for (let paras of clustereds) {
      const head = lists.head(paras);
      const last = lists.last(paras);

      const headList = isEscapseToBody ? dom.lastAncestor(head, dom.isList) : head.parentNode!;
      const parentItem = headList.parentNode!;

      if (headList.parentNode!.nodeName === 'LI') {
        paras.map((para) => {
          const newList = this.findNextSiblings(para);

          if (parentItem.nextSibling) {
            parentItem.parentNode!.insertBefore(para, parentItem.nextSibling);
          } else {
            parentItem.parentNode!.appendChild(para);
          }

          if (newList.length) {
            this.wrapList(newList, headList.nodeName);
            para.appendChild(newList[0].parentNode!);
          }
        });

        if ((headList as Element).children.length === 0) {
          parentItem.removeChild(headList);
        }

        if (parentItem.childNodes.length === 0) {
          parentItem.parentNode!.removeChild(parentItem);
        }
      } else {
        const lastList =
          headList.childNodes.length > 1
            ? dom.splitTree(
              headList,
              {
                node: last.parentNode!,
                offset: dom.position(last) + 1,
              },
              {
                isSkipPaddingBlankHTML: true,
              },
            )
            : null;

        const middleList = dom.splitTree(
          headList,
          {
            node: head.parentNode!,
            offset: dom.position(head),
          },
          {
            isSkipPaddingBlankHTML: true,
          },
        );

        paras = isEscapseToBody
          ? dom.listDescendant(middleList!, dom.isLi)
          : lists.from(middleList!.childNodes).filter(dom.isLi);

        // LI to P
        if (isEscapseToBody || !dom.isList(headList.parentNode)) {
          paras = paras.map((para) => {
            return dom.replace(para, 'P');
          });
        }

        for (const para of lists.from(paras).reverse()) {
          dom.insertAfter(para, headList);
        }

        // remove empty lists
        const rootLists = lists.compact([headList, middleList, lastList]) as Node[];
        for (const rootList of rootLists) {
          const listNodes = [rootList].concat(dom.listDescendant(rootList, dom.isList));
          for (const listNode of listNodes.reverse()) {
            if (!dom.nodeLength(listNode)) {
              dom.remove(listNode, true);
            }
          }
        }
      }

      releasedParas = releasedParas.concat(paras);
    }

    return releasedParas;
  }

  /**
   * @method appendToPrevious
   *
   * Appends list to previous list item, if
   * none exist it wraps the list in a new list item.
   *
   * @param {HTMLNode} ListItem
   * @return {HTMLNode}
   */
  appendToPrevious(node: Node): Node | Node[] {
    return node.previousSibling ? dom.appendChildNodes(node.previousSibling, [node]) : this.wrapList([node], 'LI');
  }

  /**
   * @method findList
   *
   * Finds an existing list in list item
   *
   * @param {HTMLNode} ListItem
   * @return {Array[]}
   */
  findList(node: Node | null): Node | undefined | null {
    return node
      ? lists.find(lists.from((node as Element).children), (child) => ['OL', 'UL'].indexOf(child.nodeName) > -1)
      : null;
  }

  /**
   * @method findNextSiblings
   *
   * Finds all list item siblings that follow it
   *
   * @param {HTMLNode} ListItem
   * @return {HTMLNode}
   */
  findNextSiblings(node: Node): Node[] {
    const siblings: Node[] = [];
    while (node.nextSibling) {
      siblings.push(node.nextSibling);
      node = node.nextSibling;
    }
    return siblings;
  }
}
