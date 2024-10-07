type ResultHTMLSelector<K extends string> = K extends '*'
  ? HTMLElement
  : K extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[K]
  : K extends `${infer FIRST},${infer REST}`
  ? ResultHTMLSelector<FIRST> | ResultHTMLSelector<REST>
  : K extends `${string}${' ' | '>' | '+' | '~'}${infer KK}`
  ? ResultHTMLSelector<KK>
  : K extends `${infer KK}${'.' | '[' | '#' | ':'}${string}`
  ? KK extends `${string}${'.' | '[' | '#' | ':'}${string}`
    ? never
    : KK extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[KK]
    : HTMLElement
  : never;

interface ParentNode {
  querySelector<K extends string>(selectors: K): ResultHTMLSelector<K> | null;
  querySelectorAll<K extends string>(
    selectors: K
  ): NodeListOf<ResultHTMLSelector<K>>;
}

interface HTMLElement {
  closest<K extends string>(selector: K): ResultHTMLSelector<K> | null;
}

type LocalNameFor<
  T extends HTMLElement,
  K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap
> = K extends K ? (HTMLElementTagNameMap[K] extends T ? K : never) : never;

interface HTMLTableCellElement {
  localName: LocalNameFor<HTMLTableCellElement>;
}
