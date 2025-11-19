interface Buffer {
  [index: number]: number
  length: number
  toString(encoding?: string): string
}

interface BufferConstructor {
  from(
    value: string | ArrayBuffer | ArrayLike<number> | Buffer,
    encoding?: string,
  ): Buffer
  concat(buffers: Buffer[]): Buffer
}

declare const Buffer: BufferConstructor
