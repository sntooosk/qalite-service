export interface BrowserstackCredentials {
  username?: string
  /**
   * Preferred property name for the BrowserStack access key.
   */
  accessKey?: string
  /**
   * @deprecated Use {@link accessKey} instead. Kept for backward compatibility.
   */
  acessKey?: string
}

export interface BrowserstackBuild {
  id: string
  name?: string
  status?: string
  duration?: number
  buildTag?: string
  publicUrl?: string
  devices?: unknown[]
  createdAt?: string
  startedAt?: string
}
