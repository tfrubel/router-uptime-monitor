declare module "ssh2" {
  import { EventEmitter } from "events"
  import { Readable } from "stream"

  interface ClientConfig {
    host: string
    port: number
    username: string
    password?: string
    privateKey?: string | Buffer
    readyTimeout?: number
    keepaliveInterval?: number
    keepaliveCountMax?: number
    algorithms?: {
      kex?: string[]
      serverHostKey?: string[]
      cipher?: string[]
      hmac?: string[]
      compress?: string[]
    }
  }

  interface ExecStream extends Readable {
    close(): void
    end(): void
    stderr: Readable
  }

  class Client extends EventEmitter {
    connect(config: ClientConfig): this
    exec(
      command: string,
      callback: (err: Error | null, stream: ExecStream) => void
    ): this
    shell(callback: (err: Error | null, stream: ExecStream) => void): this
    end(): this
    on(event: "ready", listener: () => void): this
    on(event: "error", listener: (err: Error) => void): this
    on(event: "close", listener: () => void): this
    on(event: "end", listener: () => void): this
  }
}
