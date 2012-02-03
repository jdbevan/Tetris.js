(function(window, undefined) {
    
var outerTetris = (function() {

        var tetris = {
            bgColor: "#EEEEEE",
            score: 0,
            scoreUnit: 10,
            isColorEqual: function(a,b) {
                if (a.match(/^#/)!==null) {
                    //a is a hex colour
                    if (b.match(/^#/)!==null) {
                        //b is a hex colour, compare hex's
                        return a == b;
                    } else {
                        //b is not a hex colour, convert a to rgb
                        var a2 = a.substr(1),
                            a_rgb = [parseInt(a2.substr(0,2),16),
                                    parseInt(a2.substr(2,2),16),
                                    parseInt(a2.substr(4,2),16)];
                        //compare rgb's
                        return (b == "rgb("+a_rgb[0]+", "+a_rgb[1]+", "+a_rgb[2]+")");
                    }
                } else {
                    //a is rgb
                    if (b.match(/^#/)!==null) {
                        //b is a hex colour, convert b to rgb
                        var b2 = b.substr(1),
                            b_rgb = [parseInt(b2.substr(0,2),16),
                                    parseInt(b2.substr(2,2),16),
                                    parseInt(b2.substr(4,2),16)];
                        //compare rgb's
                        return (a == "rgb("+b_rgb[0]+", "+b_rgb[1]+", "+b_rgb[2]+")");
                    } else {
                        //compare rgb's
                        return a == b;
                    }
                }
            },
            makeGrid: function(gridWidth,gridHeight) {
                    if (gridWidth<4) return false;
                    if (gridHeight<8) return false;
                    
                    // set up page
                    $("head").append("<style>#tetrisgame { font-family: arial; }\n#tetrisgrid .row { height: 22px; float: left; clear:both; }\n#tetrisgrid .col { float: left; margin-right: 2px; width: 20px; height: 20px; }</style>");
                    $("body").append("<div id='tetrisgame'><div>Arrow keys move and rotate.<br>\nZ drops current piece, R resets game.</div>\n<div id='tetrisinfo'></div>\n<div id='tetrisgrid'></div></div>");
                    
                    this.pieces.addPieceWithProbability("square", [[1,1],[1,1]], "red", 0.2);
                    this.pieces.addPieceWithProbability("tower", [[1],[1],[1],[1]], "yellow", 0.15);
                    this.pieces.addPieceWithProbability("step", [[0,1],[1,1]], "green", 0.1);
                    this.pieces.addPieceWithProbability("L1", [[0,0,1],[1,1,1]], "blue", 0.3);
                    this.pieces.addPieceWithProbability("L2", [[1,0,0],[1,1,1]], "purple", 0.3);
                    this.pieces.addPieceWithProbability("diagonal", [[1,0],[0,1]], "black", 0.1);
                    this.pieces.addPieceWithProbability("T", [[0,1,0],[1,1,1]], "orange", 0.2);
                
                    $(document).keydown(function(e){
                        if (e.keyCode == 82) {
                            // r - restart
                            if (tetris.activeShape !== null) {
                                clearInterval(tetris.activeShape.i);
                                tetris.activeShape = null;
                            }
                            tetris.grid.reset();
                            tetris.speed = 1500;
                            tetris.score = 0;
                        }
                        
                        var changedShape = {
                            "width": tetris.activeShape.width,
                            "height": tetris.activeShape.height,
                            "loc": {"x": tetris.activeShape.loc.x,
                                    "y": tetris.activeShape.loc.y},
                            "blocks": tetris.activeShape.blocks,
                            "rotate": tetris.activeShape.rotate
                        };
                        
                        if (e.keyCode == 37) { 
                            //left
                            if (changedShape.loc.x > 0) changedShape.loc.x--;
                            tetris.moveShapeIfNoCollision(changedShape);
                            
                        } else if (e.keyCode == 39) {
                            //right
                            if (changedShape.loc.x + changedShape.width < tetris.grid.width) changedShape.loc.x++;
                            tetris.moveShapeIfNoCollision(changedShape);
                            
                        } else if (e.keyCode == 38) {
                            //up - anticlockwise
                            changedShape.rotate(-1);
                            tetris.moveShapeIfNoCollision(changedShape);
                            
                        } else if (e.keyCode == 40) {
                            //down - clockwise
                            changedShape.rotate(1);
                            tetris.moveShapeIfNoCollision(changedShape);
                            
                        } else if (e.keyCode == 90) {
                            // z - drop
                            var origY = changedShape.loc.y;
                            for (changedShape.loc.y=tetris.grid.height-changedShape.height; changedShape.loc.y>origY; changedShape.loc.y--) {
                                if (!tetris.grid.collisionCheck(changedShape)) {
                                    break;
                                }
                            }
                            tetris.moveShapeIfNoCollision(changedShape);
                        }
                    });
                    
                    this.grid = {"width":gridWidth,
                                "height":gridHeight,
                                 "state":[],
                                 "selector": "#tetrisgame #tetrisgrid",
                                 "reset":function() {
                                     $(this.selector).empty();
                                     this.state = this.drawGrid(this.height, this.width);
                                     this.start();
                                 },
                                 "drawGrid":function(gridHeight, gridWidth){
                                     var g = [];
                                    for(var h=0; h<gridHeight; h++){
                                        $(this.selector).append("<div class='row'></div>");
                                        g[h] = [];
                                        for (var w=0; w<gridWidth; w++) {
                                            $(this.selector+" .row").eq(h).append("<div class='col' style='background-color: " + tetris.bgColor + "'></div>");
                                            g[h][w] = 0;
                                        }
                                    }
                                     return g;
                                 },
                                "start":function() {
                                    tetris.makeShape().startFall();
                                    if (tetris.speed > 500) tetris.speed -= 10;
                                },
                                "newShape":function(){
                                    this.start();
                                },
                                 "collisionCheck":function(s) {
                                     //within grid check, then stored shape check
                                     if (s.loc.x<0 || s.width+s.loc.x > this.width || s.height+s.loc.y > this.height) return true;
                                     
                                     for(var x1=0,x2=s.width; x1<x2; x1++) {
                                         for (var y1=0,y2=s.height; y1<y2; y1++) {
                                             if (y1+s.loc.y>=0 && s.blocks[y1][x1]===1 && this.state[y1+s.loc.y][x1+s.loc.x]===1) {
                                                 return true;
                                             }
                                         }
                                     }
                                     return false;
                                 },
                                 "storeShape": function(s) {
                                     for(var x1=0,x2=s.width; x1<x2; x1++) {
                                         for (var y1=0,y2=s.height; y1<y2; y1++) {
                                             if (s.blocks[y1][x1]===1 && s.loc.y>=0) this.state[y1+s.loc.y][x1+s.loc.x] = 1;
                                         }
                                     }
                                 },
                                "clearFullRows": function(rowNum) {
                                    if (rowNum < 0 || rowNum > this.height) return false;
                                    
                                    //from this y location downwards
                                    for(;rowNum<this.height;rowNum++) {
                                        var colFull = true;
                                        //check if a column is full
                                        for(var col=0;col<this.width;col++) {
                                            if (this.state[rowNum][col]===0) {
                                                colFull = false;
                                                break;
                                            }
                                        }
                                        if (colFull) {
                                            var fadeSpeed = Math.min(600, tetris.speed);
                                            $(this.selector+" .row").eq(rowNum).fadeOut(fadeSpeed, function(){
                                                var newRow = [],
                                                    rowToRemove = $(this).prevAll().length;
                                                $(this).remove();
                                                tetris.score += (rowToRemove < tetris.grid.height/4) ? tetris.scoreUnit*2 : tetris.scoreUnit;
                                                                 
                                                $(tetris.grid.selector).prepend("<div class='row'></div>");
                                                for (var k=0; k<tetris.grid.width; k++) {
                                                    $(tetris.grid.selector+" .row").eq(0).append("<div class='col' style='background-color: " + tetris.bgColor + "'></div>");
                                                    newRow[k] = 0;
                                                }
                                                tetris.grid.state.splice(rowToRemove,1);
                                                tetris.grid.state.unshift(newRow);
                                                tetris.output("Score: "+tetris.score);
                                            });
                                        }
                                    }
                                }
                          };
                    this.grid.state = this.grid.drawGrid(gridHeight, gridWidth);
                    return this.grid;
                },
                isPieceAt:function(coord){
                    if (coord.x >= 0 && coord.x < this.grid.width && coord.y >= 0 && coord.y < this.grid.height) {
                        return this.grid.state[coord.y][coord.x] == 1;
                    }
                    return false;
                },
                isNumber: function(n) {
                  return !isNaN(parseFloat(n)) && isFinite(n);
                },
                pieces: {
                    addPieceWithProbability: function(name, structure, color, prob) {
                        //need to escape the name
                        this.names[name] = this.pieces.length;
                        //check prob
                        if (!tetris.isNumber(prob) || prob < 0 || prob > 1) prob = 1;
                        //create piece
                        this.pieces[this.pieces.length] = {"color": color,
                                                           "structure":structure,
                                                           "dimensions":{"width":structure[0].length,
                                                                         "height":structure.length},
                                                           "origProb":prob,
                                                           "prob": 0,
                                                           "cumulativeProb": 0};
                        
                        this.totalGivenProbability += prob;
                        this.total++;
                        
                        //reset distributed probabilities between added pieces
                        this.calculateRelativeProbabilities();
                    },
                    calculateRelativeProbabilities: function() {
                        if (this.totalGivenProbability > 0) {
                            for(var k=0; k<this.pieces.length; k++) {
                                this.pieces[k].prob = (1 / this.totalGivenProbability) * this.pieces[k].origProb;
                                this.pieces[k].cumulativeProb = (k>0) ? this.pieces[k].prob + this.pieces[k-1].cumulativeProb : this.pieces[k].prob;
                            }
                        }
                        //debugger;
                    },
                    getPieceProbably: function() {
                        var z = Math.random();
                        console.log(z);
                        return this.binarySearch(this.pieces.length, 0, z);
                    },
                    binarySearch: function(top, bottom, needle) {
                        var mid = bottom + Math.floor((top - bottom) / 2);    
                        if (top - bottom == 1) {
                            return this.pieces[top-1];
                        } else if (needle == this.pieces[mid].cumulativeProb) {
                            return this.pieces[mid];
                        } else if (needle < this.pieces[mid].cumulativeProb) {
                            top = mid;
                            return this.binarySearch(top, bottom, needle);
                        } else /*if (needle > this.pieces[mid].cumulativeProb) */ {
                            bottom = mid;
                            return this.binarySearch(top, bottom, needle);
                        }
                    },
                    addPiece: function(name, structure, color) {
                        this.addPieceWithProbability(name, structure, color, 1);
                    },
                    getPiece: function(reference) {
                        if (tetris.isNumber(reference) && reference>=0 && reference<this.total){
                            //lookup using integer
                            return this.pieces[reference];
                        } else if (!tetris.isNumber(reference)) {
                            //lookup using name
                            //needs escaping
                            return this.pieces[this.names[reference]];
                        } else {
                            return false;
                        }
                    },
                    pieces: [],
                    names: {},
                    total: 0,
                    totalGivenProbability: 0
                },
                makeShape: function() {
                    var p = tetris.pieces.getPieceProbably();
                    
                    return {"width": p.dimensions.width,
                            "height": p.dimensions.height,
                            "blocks": p.structure,
                            "color": p.color,
                            "loc": {"x": Math.floor(tetris.grid.width/2 - 1),
                                    "y": -p.dimensions.height},
                            "fall": function() {
                                if (tetris.activeShape === null) {
                                    //add to grid
                                    tetris.activeShape = this;
                                    //draw on grid
                                    tetris.displayShape(this);
                                } else if (this.loc.y < tetris.grid.height - this.height) {
                                    //check below
                                    //for each column, see if theres something beneath empty cell
                                    //if not empty cell, skip to next column
                                    if (tetris.grid.collisionCheck({"width":this.width,
                                                                    "height":this.height,
                                                                    "loc":{"x":this.loc.x,
                                                                           "y":this.loc.y+1},
                                                                    "blocks":this.blocks})) {
                                        return this.stopFalling();
                                    }
                                    
                                    //move down
                                    tetris.removeShape(this);
                                    this.loc.y++;
                                    tetris.displayShape(this);
                                    
                                    //check again
                                    if (tetris.grid.collisionCheck({"width":this.width,
                                                                    "height":this.height,
                                                                    "loc":{"x":this.loc.x,
                                                                           "y":this.loc.y+1},
                                                                    "blocks":this.blocks})) {
                                        return this.stopFalling();
                                    }
                                } else {
                                    this.stopFalling();
                                }
                                tetris.output("Score: "+tetris.score);
                            },
                            "startFall": function() {
                                var self = this;
                                self.fall();
                                this.i = setInterval(function(){ self.fall(); }, tetris.speed);
                            },
                            "stopFalling": function(){
                                clearInterval(this.i);
                                tetris.activeShape = null;
                                tetris.grid.storeShape(this);
                                
                                if (this.loc.y > 0) {
                                    //If stopped within grid boundary
                                    tetris.grid.clearFullRows(this.loc.y);
                                    tetris.grid.newShape();
                                } else {
                                    //If stopped before its within the grid
                                    console.log("Game Over");
                                    tetris.output("Score: " + tetris.score + " - Game Over!");
                                    $(tetris.grid.selector+" .row").each(function(i, e) {
                                        $(this).find(".col").delay(250).fadeTo('slow', 0.5); //css('background-color', '#BBBBBB');
                                    });
                                }
                                //delete this;
                                return true;
                            },
                            "rotate": function(direction) {
                                var origDimensions = {"w":this.width, "h":this.height},
                                    origBlock = this.blocks,  //badly copied
                                    origLoc = {"x":this.loc.x, "y":this.loc.y};
                                    
                                if (direction > 0) {
                                    //clock
                                    this.blocks = tetris.rotateClock(this.blocks);
                                } else if (direction < 0) {
                                    //anticlock
                                    this.blocks = tetris.rotateAnticlock(this.blocks);
                                }
                                
                                this.height = this.blocks.length;
                                this.width = this.blocks[0].length;
                                
                                //Reposition a wee bit
                                if (this.height > origDimensions.h) {
                                    this.loc.y -= (this.height - origDimensions.h);
                                } else if (this.height < origDimensions.h) {
                                    this.loc.y += (origDimensions.h - this.height);
                                }
                                
                                //Check still in game boundary
                                //if (this.loc.x + this.width > tetris.grid.width ||
                                //  this.loc.y + this.height > tetris.grid.height) {
                                if (tetris.grid.collisionCheck(this)) {
                                    this.blocks = origBlock;
                                    this.loc = origLoc;
                                    this.height = origDimensions.h;
                                    this.width = origDimensions.w;
                                }
                            }
                      }
                },
                displayShape: function(shape) {
                    var loc = shape.loc;
                    for(var i=0; i<shape.height; i++){
                        for(var j=0; j<shape.width; j++){
                            
                            if (shape.blocks[i][j] == 1) {
                                var y = loc.y + i,
                                    x = loc.x + j;
                                if (x >= 0 && x < tetris.grid.width && y >= 0 && y < tetris.grid.height) {
                                    $(tetris.grid.selector+" .row").eq(y).find('.col').eq(x).css('background-color',shape.color);
                                }
                            }
                        }
                    }
                },
                rotateClock: function(m) {
                    return this.rotateArray(m, 1);
                },
                rotateAnticlock: function(m) {
                    return this.rotateArray(m, -1);
                },
                rotateArray: function (m, direction) {
                    var o = [],
                        sourceRows = m.length,
                        sourceCols = m[0].length;

                    for (var sourceRow = 0; sourceRow < sourceRows; sourceRow++) {
                        for (var sourceCol = 0; sourceCol < sourceCols; sourceCol++) {
                            var tmp = m[sourceRow][sourceCol];
                            //anti
                            if (direction < 0) {
                                if (o[sourceCols - 1 - sourceCol] === undefined) { o[sourceCols - 1 - sourceCol] = []; }
                                o[sourceCols - 1 - sourceCol][sourceRow] = tmp;
                            //console.log("Moving " + sourceRow +","+sourceCol + " to " + (sourceCols-1-sourceCol)+ ","+sourceRow);
                            } else
                            //clock
                            if (direction > 0) {
                                if (o[sourceCol] === undefined) { o[sourceCol] = []; }
                                o[sourceCol][sourceRows - 1 - sourceRow] = tmp;
                            //console.log("Moving " + sourceRow +","+sourceCol + " to " + sourceCol+ ","+(sourceRows-1-sourceRow));
                            } else {
                                o[sourceRow][sourceCol] = tmp;
                            }
                        }
                    }

                    return o;
                },
                removeShape: function(shape) {
                    var s = jQuery.extend(true, {}, shape, {"color": tetris.bgColor});
                    this.displayShape(s);
                    //delete s;
                },
                moveShapeIfNoCollision: function(newShape) {
                    if (this.grid.collisionCheck(newShape)) {
                        return false;
                    }
                    this.removeShape(this.activeShape);
                    this.activeShape.width = newShape.width;
                    this.activeShape.height = newShape.height;
                    this.activeShape.blocks = newShape.blocks;
                    this.activeShape.loc = newShape.loc;
                    this.displayShape(this.activeShape);
                    return true;
                },
                output: function(msg) {
                    $("#tetrisgame #tetrisinfo").html(msg);
                },
                activeShape: null,
                speed: 1000
        };
        
        return tetris;
    })();
    window.tetris = outerTetris;
})(window);
