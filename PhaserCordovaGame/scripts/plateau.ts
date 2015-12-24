﻿module PhaserCordovaGame {
    export class Plateau extends Phaser.Group {
        pieces: Array<Piece>;
        taillePlateau: number;
        tailleCercle: number = 100;
        centre: Phaser.Point = new Phaser.Point(200, 200);

        constructor(game: Phaser.Game, size: number) {
            super(game, null,"plateau",true);
            this.taillePlateau = size;
            this.pieces = [];
        }

        public insertPiece(position: number, pieceAInserer: Piece) {
            Assert.AssertBetween(position, 0, this.taillePlateau);
            this.pieces = ArrayUtil.insert(this.pieces, pieceAInserer, position);
            this.refreshPositions();
        }


        public refreshPositions() {
            var taille = this.pieces.length;
            var angle = 0;
            var pas = (2 * Math.PI) / taille;
            this.pieces.forEach((p, i) => {
                var x = Math.round(this.centre.x + this.tailleCercle * Math.cos(angle) - this.centre.x / 2);
                var y = Math.round(this.centre.y + this.tailleCercle * Math.sin(angle) - this.centre.y / 2);
                p.x = x;
                p.y = y;
                angle += pas;
            });
        }


        // TODO : gerer la "boucle" entre la derniere et la premiere : 
        // si derniere == premiere, on boucle jusqu'a ce qu'on ait une difference
        public findCombinaison() {
            var threehold = 4;
            var tableauSimple: TypePiece[] = this.pieces.map((p, i, a) => p.type);
            var combinations = [];
            var current = [];
            var last = null;
            for (var i = 0; i < tableauSimple.length; i++) {
                if (last != tableauSimple[i]) {
                    if (current.length >= threehold){
                        combinations.push(current);
                    }
                    current = [];
                    last = tableauSimple[i];
                }
                current.push(i);
            }
            if (current.length >= threehold) {
                combinations.push(current);
            }
            console.log(combinations);
        }
    }
}