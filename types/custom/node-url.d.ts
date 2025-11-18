declare module 'node:url' {
  class URL {
    constructor(input: string, base?: string)
    pathname: string
    searchParams: {
      get(name: string): string | null
    }
  }
}
