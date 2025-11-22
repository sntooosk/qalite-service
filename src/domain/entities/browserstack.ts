export interface BrowserstackCredentials {
  username?: string
  password?: string
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
