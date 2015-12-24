﻿module PhaserCordovaGame {

    export class Piece extends Phaser.Sprite {

        type: TypePiece;

        constructor(game: Phaser.Game, texture : string) {
            super(game, 0, 0, texture);
            this.scale = new Phaser.Point(0.5, 0.5);
            game.add.existing(this);
        }        
    }

    export enum TypePiece {
        Vert,
        Rouge
    }
}