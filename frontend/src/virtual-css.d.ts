declare module 'virtual:css-injected-by-js' {
  export interface InjectCSSOptions {
    target?: HTMLElement | ShadowRoot
  }
  export function injectCSS(opts?: InjectCSSOptions): void
  export function getRawCSS(): string
}
