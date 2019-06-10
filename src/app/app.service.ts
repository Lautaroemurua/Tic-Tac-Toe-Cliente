/* 
* @author Lautaro Murua
* Examen tecnico Silstech
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

// Importo la libreria rxjs 
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import * as io from 'socket.io-client';

@Injectable()
export class AppService {
	//Constante que define el tablero de Tic-Tac-Toe
	public gameGrid = <Array<Object>>[[1, 2, 3], [4, 5, 6], [7, 8, 9]];
	//Constante para el llamado de SocketEvent y HTTP
	private BASE_URL = 'http://localhost:4000';
	public socket;
	private headerOptions = new RequestOptions({
		headers: new Headers({ 'Content-Type': 'application/json;charset=UTF-8' })
	});
	constructor(private http: HttpClient) {}

	 // Este metodo se suscribira a un evento para obtener el recuento de las salas disponibles
	public getRoomStats() {
		return new Promise(resolve => {
			this.http.get(`http://localhost:4000/getRoomStats`).subscribe(data => {
				resolve(data);
			});
		});
	}
	//Metodo para conectar los usuarios al socket
	connectSocket() {
		this.socket = io(this.BASE_URL);
	}
	//Metodo para recibir las room disponibles
	getRoomsAvailable(): any {
		const observable = new Observable(observer => {
			this.socket.on('rooms-available', (data) => {
				observer.next(
					data
				);
			});
			return () => {
				this.socket.disconnect();
			};
		});
		return observable;
	}
	//Metodo para crear una nueva room, evento create-room.
	createNewRoom(): any {
		this.socket.emit('create-room', { 'test': 9909 });
		const observable = new Observable(observer => {
			this.socket.on('new-room', (data) => {
				observer.next(
					data
				);
			});
			return () => {
				this.socket.disconnect();
			};
		});
		return observable;
	}
	//Metodo para unirse a una nueva room, evento create-room
	joinNewRoom(roomNumber): any {
		this.socket.emit('join-room', { 'roomNumber': roomNumber });
	}
	//Metodo que recibe el evento de inicio de juego
	startGame(): any {
		const observable = new Observable(observer => {
			this.socket.on('start-game', (data) => {
				observer.next(
					data
				);
			});
			return () => {
				this.socket.disconnect();
			};
		});
		return observable;
	}
	//Metodo para unirse a una nueva room, evento create-room
	sendPlayerMove(params): any {
		this.socket.emit('send-move', params);
	}
	// Metodo que recibe al evento de inicio de juego
	receivePlayerMove(): any {
		const observable = new Observable(observer => {
			this.socket.on('receive-move', (data) => {
				observer.next(
					data
				);
			});
			return () => {
				this.socket.disconnect();
			};
		});
		return observable;
	}
	//Evento que comprueba si algun jugador abandona el juego
	playerLeft(): any {
		const observable = new Observable(observer => {
			this.socket.on('room-disconnect', (data) => {
				observer.next(
					data
				);
			});
			return () => {
				this.socket.disconnect();
			};
		});
		return observable;
	}
}
