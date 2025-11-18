declare module 'events' {
  class EventEmitter {
    on(event: string, listener: (...args: any[]) => void): this
    emit(event: string, ...args: any[]): boolean
  }

  export { EventEmitter }
}
