import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { environment } from '@env/environment';
import { BehaviorSubject, Observable } from 'rxjs';

interface ISocketState {
  zabbixAlerts: object[];
}
type ISocketMessage = 'zabbixAlerts' | 'none';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: any;

	readonly state$: Observable<ISocketState>;
	private readonly subject: BehaviorSubject<ISocketState>;

	private get store(): ISocketState {
		return this.subject.getValue();
	}
	private set store(val: ISocketState) {
		this.subject.next(val);
	}

  constructor() {
		this.subject = new BehaviorSubject<ISocketState>({
      zabbixAlerts: [],
		});
    this.state$ = this.subject.asObservable();
  }

  public connect(token: string) {
    this.socket = io.connect(environment.api.ws.uri);
    this.socket.emit('subscribe', { token }, () => console.log("Subscribed!"));
    // On Reconnect Attempt Event - Enable Polling
    this.socket.on('reconnect_attempt', () => this.socket.io.opts.transports = ['polling', 'websocket']);
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public receive(...messageTypes: ISocketMessage[]) {
    messageTypes.forEach(messageType => {
      switch(messageType) {
        case 'zabbixAlerts': this.onZabbixAlerts(); break;
      }
    });
  }

  public clear(...messageTypes: ISocketMessage[]) {
    messageTypes.forEach(messageType => {
      switch(messageType) {
        case 'zabbixAlerts': this.store = { ...this.store, zabbixAlerts: [] }; break;
      }
    });
  }

  private onZabbixAlerts() {
    this.socket.on('zabbix-notify', function(data: any) {
      this.store = { ...this.store, zabbixAlerts: JSON.parse(data) };
    });
  }
}
