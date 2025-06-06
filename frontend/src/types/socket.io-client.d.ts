declare module 'socket.io-client' {
  import { ManagerOptions, SocketOptions } from 'socket.io-client';
  
  export interface Socket {
    on(event: string, callback: (data?: any) => void): Socket;
    off(event?: string): Socket;
    emit(event: string, ...args: any[]): Socket;
    disconnect(): Socket;
    connect(): Socket;
    connected: boolean;
  }
  
  export interface ManagerOptions {
    path?: string;
    transports?: string[];
    timeout?: number;
    autoConnect?: boolean;
    query?: object;
    auth?: object;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    randomizationFactor?: number;
  }
  
  export interface SocketOptions {
    forceNew?: boolean;
    multiplex?: boolean;
  }
  
  export function io(
    uri: string, 
    opts?: Partial<ManagerOptions & SocketOptions>
  ): Socket;
  
  export default io;
}
