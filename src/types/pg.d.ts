declare module 'pg' {
  export class Client {
    constructor(config?: any)
    connect(): Promise<void>
    query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }>
    end(): Promise<void>
  }
}
