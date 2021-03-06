﻿module PhaserCordovaGame {
    export class Plateau extends Phaser.Group {
        pieces: Array<Array<Piece>>;
        taillePlateauX: number;
        taillePlateauY: number;
        scale: Phaser.Point;
        pas: number;
        acceptInput: boolean;
        listTeensBloquants: Phaser.Tween[];

        constructor(game: Phaser.Game, sizeX: number, sizeY: number) {
            super(game, null, "plateau", true);
            this.taillePlateauX = sizeX;
            this.taillePlateauY = sizeY;
            // X est plus petit que Y
            this.pas = (SimpleGame.realWidth * 0.8) / this.taillePlateauX;
            this.processScale();
            this.initTableau();
            this.refreshPosition();
            this.acceptInput = true;
        }

        private processScale() {
            var p = PieceFactory.CreatePiece(this.game, TypePiece.Vert);
            var originalHeight = p.texture.height
            this.scale = new Phaser.Point(this.pas / originalHeight, this.pas / originalHeight);
            p.kill();
        }

        private initTableau() {
            this.pieces = [];
            for (var x = 0; x < this.taillePlateauX; x++) {
                this.pieces[x] = [];
                for (var y = 0; y < this.taillePlateauY; y++) {
                    this.pieces[x][y] = PieceFactory.CreatePieceRandom(this.game);
                }
            }
        }

        public refreshPosition() {
            this.listTeensBloquants = new Array<Phaser.Tween>();
            var debutX = SimpleGame.realWidth * 0.1 + this.pas / 2;
            var debutY = (SimpleGame.realHeight - (this.taillePlateauY * this.pas)) / 2;
            for (var x = 0; x < this.taillePlateauX; x++) {
                for (var y = 0; y < this.taillePlateauY; y++) {
                    var p = this.pieces[x][y];
                    var tween = this.game.add.tween(p);
                    tween.to(
                        {
                            x: debutX + this.pas * x,
                            y: debutY + this.pas * y
                        }, GameConfiguration.GAMEANIM_SPEED, Phaser.Easing.Quartic.In, false);
                    // si nouvellement créé
                    // on les place au dessus
                    if (p.x == 0 && p.y == 0) {
                        p.x = debutX + this.pas * x;
                        p.y = debutY - this.pas;
                    }

                    p.scale = this.scale;
                    this.listTeensBloquants.push(tween);
                    // Si actif, on clean
                    this.setupClickEventPiece(p, x, y);
                   
                }
            }

            this.listTeensBloquants.forEach((v: Phaser.Tween, i: number, arr: Phaser.Tween[]) => {
                v.onComplete.addOnce(() => {
                    // si tous les tweens sont finis
                    if (this.tweensFinished()) {
                        this.acceptInput = true;
                    }
                }, this);
                v.start();
            });

        }

        public setupClickEventPiece(p: Piece, x: number, y: number) {
            if (p.inputEnabled) {
                p.inputEnabled = false;
                p.events.onInputUp.removeAll();
            }
            p.inputEnabled = true;
            p.events.onInputUp.addOnce((dummy, dummy2, dummy3, posX, posY) => {
                if (this.acceptInput) {
                    this.acceptInput = false;
                    this.combineZone(posX, posY);
                }
            }, this, 0, x, y);
        }

        public tweensFinished(): boolean {
            return this.listTeensBloquants.every((v) => {
                return !v.isRunning;
            });
        }

        public getZoneCombine(x: number, y: number): Array<Array<number>> {
            var valid = [[x, y]];
            // valid change de taille en live
            for (var compteurDeTest = 0; compteurDeTest < valid.length; compteurDeTest++) {
                var current = valid[compteurDeTest];
                var temp = this.findValidNeighbors(current[0], current[1]);
                // on traite les voisins possibles
                for (var j = 0; j < temp.length; j++) {
                    var currentNeigbhor = temp[j];
                    // si le voisin n'a pas encore été prévu pour verification
                    if (!ArrayUtil.containsArray(valid, currentNeigbhor)) {
                        // on l'ajoute à la liste des valides à tester.
                        valid.push(currentNeigbhor);
                    }
                }
            }
            return valid;
        }

        public findValidNeighbors(x: number, y: number): Array<Array<number>> {
            var listNeigbor = this.getNeigbhor(x, y);
            var p = this.pieces[x][y];
            return this.selectNeighborForCombine(p, listNeigbor);
        }

        public getNeigbhor(x: number, y: number): Array<Array<number>> {
            var potentials = [];
            if (x > 0) {
                potentials.push([x - 1, y]);
            }
            if (y > 0) {
                potentials.push([x, y - 1]);
            }
            if (y < this.taillePlateauY - 1) {
                potentials.push([x, y + 1]);
            }
            if (x < this.taillePlateauX - 1) {
                potentials.push([x + 1, y]);
            }
            return potentials;
        }

        public selectNeighborForCombine(origine: Piece, potentiels: Array<Array<number>>): Array<Array<number>> {
            var result = [];
            potentiels.forEach((pos, i, res) => {
                if (origine.canCombine(this.pieces[pos[0]][pos[1]])) {
                    result.push(pos);
                }
            }, this);
            return result;
        }

        public combineZone(x: number, y: number) {
            var list = this.getZoneCombine(x, y);
            console.log("Suppression de " + list.length + " elements");
            // à optimiser : refresh que les modifiés)
            list.forEach((pos, i, arr) => {
                var p = this.pieces[pos[0]][pos[1]];
                p.delete();
                this.pieces[pos[0]][pos[1]] = null;
            });

            this.fallingDown();
            this.spawnNewPieces();
            this.refreshPosition();
            console.log(this.printConsolePlateau());
        }


        private fallingDown() {
            // pour chaque X : on regarde les Y  depuis la fin
            // dès qu'on trouve un null, et qu'il n'y a pas que des null avant, on avance les precedents de 1
            // jusqu'a ce que ça soit bon
            // et on continue
            for (var x = 0; x < this.taillePlateauX; x++) {
                for (var y = this.taillePlateauY - 1; y > 0; y--) {
                    var reste = this.pieces[x].slice(0, y);
                    // tant que la piece est null ET qu'on a pas que des null
                    while (this.pieces[x][y] == null && !reste.every((x, n, a) => x == null)) {
                        ArrayUtil.decalePiece(this.pieces[x], y);
                    }
                }
            }
        }

        private spawnNewPieces() {
            for (var x = 0; x < this.taillePlateauX; x++) {
                for (var y = 0; y < this.taillePlateauY; y++) {
                    if (this.pieces[x][y] == null) {
                        this.pieces[x][y] = PieceFactory.CreatePieceRandom(this.game);
                    }
                }
            }

        }


        public printConsolePlateau(): string {
            var res = "";
            for (var y = 0; y < this.taillePlateauY; y++) {

                for (var x = 0; x < this.taillePlateauX; x++) {

                    if (this.pieces[x][y] != null) {
                        res += this.pieces[x][y].type;
                    } else {
                        res += "X";
                    }
                }
                res += "\n";
            }
            return res;
        }
    }
}