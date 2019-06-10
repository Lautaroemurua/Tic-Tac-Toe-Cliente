import { Component, Renderer, ViewChild , OnInit } from '@angular/core';
import { AppService } from './app.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	providers: [AppService]
})
export class AppComponent implements OnInit {

	//Titulo
	private title = 'Tic-Tac-Toe NodeJs, Redis, Angular y Socket.IO  —  Examen tecnico Silstech';
	//Array de Objetos que representa el tablero
	private gameGrid = <Array<Object>>[];
	//Inforamcion del tablero (X y O)
	private playedGameGrid = <Array<Object>>[];
	//Controla el movimiento de cada jugador
	private movesPlayed = <number>0;
	//Esta variable representa el turno de jugar
	private displayPlayerTurn = <Boolean>true;
	//Esta variable deshabilita el turno para que juege una sola vez
	private myTurn = <Boolean>true;
	//Esta variable decie quien comienza
	private whoWillStart = <Boolean>true;

	//Bootstrap modal Options
	@ViewChild('content') private content;
	private modalOption: NgbModalOptions = {};

	//Variables y constantes de socket ,ng-models
	private totalRooms = <Number> 0;
	private emptyRooms = <Array<number>> [];
	private roomNumber = <Number> 0;
	private playedText = <string>'';
	private whoseTurn = 'X';

	constructor(
		private _renderer: Renderer,
		private modalService: NgbModal,
		private appService: AppService,
	) {
		this.gameGrid = appService.gameGrid;
	}

	ngOnInit() {
		//Muestro el modal
		this.modalOption.backdrop = 'static';
		this.modalOption.keyboard = false;
		this.modalOption.size = 'lg';
		const localModalRef = this.modalService.open(this.content, this.modalOption);

		//Conecto el jugador con el socket
		this.appService.connectSocket();

		// Llamada HTTP para obtener las room vacias y numero total de room
		this.appService.getRoomStats().then(response => {
			this.totalRooms = response['totalRoomCount'];
			this.emptyRooms = response['emptyRooms'];
		});

		// El evento Socket localizara las room disponibles para jugar
		this.appService.getRoomsAvailable().subscribe(response => {
			this.totalRooms = response['totalRoomCount'];
			this.emptyRooms = response['emptyRooms'];
		});

		// Evento Socket para iniciar nuevo juego
		this.appService.startGame().subscribe((response) => {
			localModalRef.close();
			this.roomNumber = response['roomNumber'];
		});

		// El evento Socket recibira el moviento del oponente
		this.appService.receivePlayerMove().subscribe((response) => {
			this.opponentMove(response);
		});

		// Evento Socket que comprobara si algun jugador abandona la sala y vuelve a cargar la pagina
		this.appService.playerLeft().subscribe((response) => {
			alert('Player Left');
			window.location.reload();
		});
	}

	/**
	 *Metodo que permite unirse a una nueva sala pasando el numero de room
	 @param roomNumber
	 */
	joinRoom(roomNumber) {
		this.myTurn = false;
		this.whoWillStart = false;
		this.whoseTurn = 'O';
		this.appService.joinNewRoom(roomNumber);
	}
	 //Metodo para crear nuevar room
	createRoom() {
		this.myTurn = true;
		this.whoseTurn = 'X';
		this.whoWillStart = true;
		this.appService.createNewRoom().subscribe( (response) => {
			this.roomNumber = response.roomNumber;
		});
	}

	/**
	 * Este metodo sera llamado por el suscriptor del evento Socket para hacer el movimiento del oponente
	 * @param params
	 */
	opponentMove(params) {
		this.displayPlayerTurn = !this.displayPlayerTurn ? true : false;
		if (params['winner'] ===  null) {
			this.playedGameGrid[params['position']] = {
				position: params['position'],
				player: params['playedText']
			};
			this.myTurn = true;
		}else {
			alert(params['winner']);
			this.resetGame();
		}
	}

	/**
	 * Este metodo se llamara cuando el jugador actual intente realizar una jugada
	 * Y envio el evento Socket al servidor para actualizar en redis
	 * @param number
	 */
	play(number) {
		if (!this.myTurn) {
			return;
		}
		this.movesPlayed += 1;
		this.playedGameGrid[number] = {
			position: number,
			player: this.whoseTurn
		};
		this.appService.sendPlayerMove({
			'roomNumber' : this.roomNumber,
			'playedText': this.whoseTurn,
			'position' : number,
			'playedGameGrid': this.playedGameGrid,
			'movesPlayed' : this.movesPlayed
		});
		this.myTurn = false;
		this.displayPlayerTurn = !this.displayPlayerTurn ? true : false;
	}
	/**
	 * Este Metodo representara los datos en el tablero
	 * @param number
	 */
	renderPlayedText(number) {
		if (this.playedGameGrid[number] === undefined) {
			return '';
		}else {
			this.playedText = this.playedGameGrid[number]['player'];
			return this.playedText;
		}
	}
	/**
	 * Este metodo reinicia el juego
	 */
	resetGame() {
		this.playedGameGrid = [];
		this.gameGrid = [];
		this.gameGrid = this.appService.gameGrid;
		this.movesPlayed = 0;
		if (this.whoWillStart) {
			this.myTurn = true;
			this.displayPlayerTurn = true;
			this.whoseTurn = 'X';
		}else {
			this.displayPlayerTurn = true;
			this.whoseTurn = 'O';
		}
	}
}