﻿module PhaserCordovaGame {
    export class PieceBleu extends Piece {
        constructor(game: Phaser.Game) {
            super(game, AssetKeys.assetBillebleu);
            this.type = TypePiece.Bleu;
        } 

        public canCombine(other: Piece) {
            if (other == null || other == undefined) {
                throw new ReferenceError("Impossible de comparer à null");
            }
            return this.type == other.type || other.type == TypePiece.Jaune;
        } 
    }
}