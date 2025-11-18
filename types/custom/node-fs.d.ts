declare module 'node:fs' {
  function existsSync(path: string): boolean
  function readFileSync(path: string, encoding: string): string
}
