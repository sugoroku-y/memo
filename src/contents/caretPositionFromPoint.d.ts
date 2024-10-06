interface CaretPosition {
  /** キャレットの位置で見つかったノードを含む {@link Node} を返します。 */
  offsetNode: Node;
  /** キャレット位置ノードの文字オフセットを表す long を返します。 */
  offset: number;
  /** キャレット範囲のクライアント長方形を返します。 */
  getClientRect(): {};
}

interface Document {
  /**
   * キャレットを持つ DOM ノードと、そのノード内でのキャレットの文字オフセットを CaretPosition オブジェクトを返します。
   * @param x
   * @param y
   */
  caretPositionFromPoint?: (x: number, y: number) => CaretPosition;
}
