type AllElementTagNameMap = HTMLElementTagNameMap &
  Omit<SVGElementTagNameMap, keyof HTMLElementTagNameMap> &
  Omit<
    MathMLElementTagNameMap,
    keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap
  >;

type ResultQuerySelector<
  K extends string,
  Default extends Element = Element,
  TagNameMap extends object = AllElementTagNameMap
> = K extends '*'
  ? Default
  : K extends keyof TagNameMap
  ? TagNameMap[K]
  : K extends `${infer FIRST},${infer REST}`
  ? ResultQuerySelector<FIRST> | ResultQuerySelector<REST>
  : K extends `${string}${' ' | '>' | '+' | '~' | '|'}${infer KK}`
  ? ResultQuerySelector<KK>
  : K extends `${infer KK}${'.' | '[' | '#' | ':'}${string}`
  ? KK extends `${string}${'.' | '[' | '#' | ':'}${string}`
    ? never
    : KK extends keyof TagNameMap
    ? TagNameMap[KK]
    : Default
  : never;
type ResultHTMLQuerySelector<K extends string> = ResultQuerySelector<
  K,
  HTMLElement,
  HTMLElementTagNameMap
>;

interface ParentNode {
  querySelector<K extends string>(selectors: K): ResultQuerySelector<K> | null;
  querySelectorAll<K extends string>(
    selectors: K
  ): NodeListOf<ResultQuerySelector<K>>;
}

interface Element {
  closest<K extends string>(selector: K): ResultQuerySelector<K> | null;
}

interface HTMLElement {
  querySelector<K extends string>(
    selectors: K
  ): ResultHTMLQuerySelector<K> | null;
  querySelectorAll<K extends string>(
    selectors: K
  ): NodeListOf<ResultHTMLQuerySelector<K>>;
  closest<K extends string>(selector: K): ResultHTMLQuerySelector<K> | null;
}

type LocalNameFor<
  T extends Element,
  K extends keyof AllElementTagNameMap = keyof AllElementTagNameMap
> = K extends K ? (AllElementTagNameMap[K] extends T ? K : never) : never;

interface HTMLTableCellElement {
  localName: LocalNameFor<HTMLTableCellElement>;
}
