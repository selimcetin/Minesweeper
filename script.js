window.addEventListener("load", () =>
{
    Minesweeper.init();
});

const Minesweeper =
{
    // Variables
    //----------
    divContent: 0,
    divPlayfield: 0,

    // Functions
    //----------
    init: function()
    {
        this.divContent = document.body.getElementsByClassName("content");
        this.divPlayfield = document.body.getElementsByClassName("playfield");
        this.defineBody();
        this.defineHeader(this.divContent[0]);
        this.definePlayfield(this.divContent[0]);
        this.defineButtons(this.divContent[0]);
        this.defineFooter(this.divContent[0]);
        gameController.createPlayfield(0, this.divPlayfield[0]);
    },

    defineBody: function()
    {
        let body = document.body;
        let div = document.createElement("div");
        div.classList.add("content");
        body.appendChild(div);
    },

    defineHeader: function(divContent)
    {
        // Create header elements
        //-----------------------
        let divTitle = document.createElement("div");
        let divTitleText = document.createElement("div");
        let header = document.createElement("h1");
        let p =  document.createElement("p");
        header.appendChild(this.getTextNode("Minesweeper"));
        p.appendChild(this.getTextNode("by Selim Cetin"));

        // Create HTML-Structure, indent is for visibility
        //------------------------------------------------
        divTitle.classList.add("title");
            divTitle.appendChild(divTitleText);
            divTitleText.classList.add("title_text");
                divTitleText.appendChild(header);
                divTitleText.appendChild(p);

        divContent.appendChild(divTitle);
    },

    definePlayfield: function(divContent)
    {
        let divPlayfield = NodeFactory.createDivPlayfield();
        let divOverlay = NodeFactory.createDivOverlay();

        gameController.createPlayfield(0, divPlayfield);

        divContent.appendChild(divPlayfield);
        
        
    },

    defineButtons: function(divContent)
    {
        // Create the buttons and container
        //---------------------------------
        let divButtons = document.createElement("div");
        let btnSmall = document.createElement("button");
        let btnMedium = document.createElement("button");
        let btnLarge = document.createElement("button");

        // Set buttons and container attributes
        //-------------------------------------
        divButtons.classList.add("buttons");
        btnSmall.setAttribute("id", "btn_small");
        btnMedium.setAttribute("id", "btn_medium");
        btnLarge.setAttribute("id", "btn_large");
        btnSmall.appendChild(this.getTextNode("Small"));
        btnMedium.appendChild(this.getTextNode("Medium"));
        btnLarge.appendChild(this.getTextNode("Large"));

        // Put buttons inside button-Div
        //------------------------------
        divContent.appendChild(divButtons);
            divButtons.appendChild(btnSmall);
            divButtons.appendChild(btnMedium);
            divButtons.appendChild(btnLarge);

        let divPlayfield = divContent.getElementsByClassName("playfield");

        // Add click-Events for the buttons
        //---------------------------------
        btnSmall.addEventListener("click", (event) => gameController.createPlayfield(0, divPlayfield[0]));
        btnMedium.addEventListener("click", (event) => gameController.createPlayfield(1, divPlayfield[0]));
        btnLarge.addEventListener("click", (event) => gameController.createPlayfield(2, divPlayfield[0]));
    },

    defineFooter: function(divContent)
    {
        // Create footer elements
        //-----------------------
        let divFooter = document.createElement("div");
        let footer = document.createElement("footer");

        // Add attributes and append to content-div
        //-----------------------------------------
        divFooter.classList.add("footer");
        footer.appendChild(this.getTextNode("© 2025 by Selim Cetin"));
        divFooter.appendChild(footer);
        divContent.appendChild(divFooter);
    },

    getTextNode: function(text)
    {
        return document.createTextNode(text);
    },

    test: function()
    {
        let arr = [1,2];

        for(let i of arr)
        {
            let random = Math.floor(Math.random()*2)
            if(random)
                arr.push(i+1);
            
            console.log("i: " + i);
            console.log("random: " + random);
            console.log(arr);
        }
    }
}

const gameController =
{
    // Variables
    //----------
    gameEndCounter: 0,
    gameType: 0,
    numCells: 81,
    numMines: 9,
    arrPlayfield: new Array(),
    touchstartTime: new Date(),
    touchendTime: new Date(),
    firstSweep: 1,

    // Functions
    //----------
    createPlayfield: function(gameType, divPlayfield)
    {
        this.numCells = (9+gameType*8)**2;
        this.numMines = 18+gameType*45;
        this.gameType = gameType;
        this.firstSweep = 1;

        // Empty the playfield
        //--------------------
        divPlayfield.innerHTML = '';

        // Insert cells into playfield
        //----------------------------
        let divCell = NodeFactory.createDivCell();
        let y = -1;
        let rowNum = Math.sqrt(this.numCells);
        for(let i = 0; i < this.numCells; i++)
        {
            // Put x and y values inside the element dataset
            //----------------------------------------------
            if(!(i%rowNum)) y += 1;
            divCell.dataset.x = i%rowNum;
            divCell.dataset.y = y;
            divPlayfield.appendChild(divCell.cloneNode());
        }

        // Change width/height for cells
        //------------------------------
        let divArrCells = document.getElementsByClassName("cells");
        NodeFactory.setStyleForCells(divArrCells);

        NodeFactory.setEventListenersOnCells();
    },

    createLogicArr: function()
    {
        let boolArr = new Array();
        let maxArrIndex = Math.sqrt(this.numCells);

        // Create boolean playfield, 2d-Array
        //-----------------------------------
        for(let x = 0; x < maxArrIndex; x++)
        {
            boolArr.push(new Array(maxArrIndex));
            for(let y = 0; y < maxArrIndex; y++)
            {
                boolArr[x][y] = false;
            }
        }
        this.arrPlayfield = boolArr;
    },

    leftClickCell: function(event, el)
    {
        if(this.firstSweep)
        {
            this.firstSweep = 0;
            this.createLogicArr();
            this.placeMinesOnField(this.arrPlayfield, el);
        }
        
        if(!this.cellHasFlag(el))
            this.uncoverCell(this.arrPlayfield, el)
    },

    rightClickCell: function(event, el)
    {
        this.markFlag(el);
    },

    touchStartCell: function(event, el)
    {
        this.touchstartTime = Date.getTime();
    },

    touchEndCell: function(event, el)
    {
        this.touchendTime = Date.getTime();
        let deltaTime = this.touchendTime - this.touchstartTime;

        if(deltaTime > 2000) this.leftClickCell(event, el);
        else this.rightClickCell(event, el);
    },

    placeMinesOnField: function(boolArr, el)
    {
        let mineCount = 0;
        let row = Math.sqrt(this.numCells);
        let neighbourList = this.getNeighbourList(el);

        // Stop loop only when all mines are placed
        //-----------------------------------------
        while(true)
        {
            let randomX = Math.floor(Math.random()*row);
            let randomY = Math.floor(Math.random()*row);

            let temp_el = NodeFactory.getElementByDataset(randomX, randomY);

            // Only place mines outside of the clicked cell and its neighbours
            //----------------------------------------------------------------
            if(temp_el != el && !neighbourList.includes(temp_el) && !boolArr[randomX][randomY])
            {
                mineCount++;
                boolArr[randomX][randomY] = true;
                console.log("x: " + randomX + " y: " + randomY);
            }

            if(mineCount >= this.numMines) break;
        }

        //console.log(mineCount);
    },

    cellHasMine: function(boolArr, el)
    {
        if(boolArr[el.dataset.x][el.dataset.y]) return true;
    },

    cellHasFlag: function(el)
    {
        temp_el = NodeFactory.getElementByDataset(el.dataset.x, el.dataset.y);
        return (temp_el.classList.contains("mark_flag") ? true : false);
    },

    uncoverCell: function(boolArr, el)
    {
        if(this.cellHasMine(boolArr, el))
        {
            this.markMine(el);
            this.gameLost(boolArr);
        }
        else
        {
            let neighbourList = this.getNeighbourList(el);
            let mineCount = this.getCellMineCount(boolArr, neighbourList);

            if(0 == mineCount)
            {
                todoArr = new Array();
                doneArr = new Array();
                this.checkAllEmptyNeighbours(boolArr, el, todoArr, doneArr);
            }
            else
            {
                this.markCell(el, mineCount);
            }
        }

        if(this.isGameWon())
            this.gameWon();
    },

    markCell: function(el, mineCount)
    {
        el.classList.remove("covered");

        if(mineCount)
        {
            el.classList.add("mark_" + mineCount);
        }
    },

    markFlag: function(el)
    {
        if(el.classList.contains("mark_flag"))
            el.classList.remove("mark_flag");
        else
            el.classList.add("mark_flag");
    },

    markMine: function(el)
    {
        el.classList.remove("covered");
        el.classList.add("mark_mine");
    },

    getCellMineCount: function(boolArr, neighbourList)
    {
        let mineCount = 0;

        for(let el of neighbourList)
        {
            let x = parseInt(el.dataset.x);
            let y = parseInt(el.dataset.y);
            if(boolArr[x][y])
                mineCount++;
        }
        return mineCount;
    },

    getCellUncoveredCount: function()
    {
        coveredArr = document.getElementsByClassName("covered");

        return (this.numCells - coveredArr.length);
    },

    isGameWon: function()
    {
        let uncovCount = this.getCellUncoveredCount();
        let targetCount = this.numCells - this.numMines;

        console.log(uncovCount);
        console.log(targetCount);

        return ((uncovCount == targetCount) ? true : false);
    },

    getNeighbourList: function(el)
    {
        let el_x = parseInt(el.dataset.x);
        let el_y = parseInt(el.dataset.y);
        let maxArrIndex = Math.sqrt(this.numCells) - 1;
        let neighbourList = new Array();
        
        for(let x = -1; x <= 1; x++)
        {
            for(let y = -1; y <= 1; y++)
            {
                let tempX = el_x + x;
                let tempY = el_y + y;

                // Skip the examined cell (X) or when index is out of border
                //----------------------------------------------------------
                if((!x && !y) || tempX < 0 || tempX > maxArrIndex || tempY < 0 || tempY > maxArrIndex)
                    continue;

                // Otherwise add element to list
                //------------------------------
                neighbourList.push(NodeFactory.getElementByDataset(el_x + x, el_y + y));
            }
        }
        return neighbourList;
    },

    checkAllEmptyNeighbours: function(boolArr, el, todoArr, doneArr)
    {
        // Add all neighbours of clicked cell into todoArr
        //------------------------------------------------
        let neighbourList = this.getNeighbourList(el);
        for(let temp_el of neighbourList)
        {
            todoArr.push(temp_el);
        }

        // Then work until todoArr is empty
        // All elements inside todoArr must be examined
        //---------------------------------------------
        while(todoArr.length != 0)
        {
            for(let el of todoArr)
            {
                let neighbourList = this.getNeighbourList(el);
                let mineCount = this.getCellMineCount(boolArr, neighbourList);

                // Ignore if element is inside doneList
                // and remove from todo-List
                //--------------------------
                if(doneArr.includes(el))
                {
                    this.removeFromArr(todoArr, el);
                    continue;
                }

                if(0 == mineCount)
                {
                    for(let temp_el of neighbourList)
                    {
                        if(!doneArr.includes(temp_el))
                            todoArr.push(temp_el);
                    }
                }

                this.markCell(el, mineCount);

                // Add examined cell to done and remove from todo
                //-----------------------------------------------
                doneArr.push(el);
                this.removeFromArr(todoArr, el);
                
            }
        }
    },

    removeFromArr: function(arr, el)
    {
        const i = arr.indexOf(el);
        if (i > -1)                 // only splice array when item is found
            arr.splice(i, 1);   // 2nd parameter means remove one item only
    },

    revealAllMines: function(boolArr)
    {
        for(let x = 0; x < boolArr.length; x++)
        {
            for(let y = 0; y < boolArr.length; y++)
            {
                if(boolArr[x][y])
                {
                    let el = NodeFactory.getElementByDataset(x,y);
                    this.markMine(el);
                }
            }
        }
    },

    gameWon: function()
    {
        let divPlayfield = document.getElementsByClassName("playfield")[0];
        let divOverlay = NodeFactory.createDivOverlay("You won");
        divPlayfield.appendChild(divOverlay);

        this.firstSweep = 1;
        this.revealAllMines(boolArr);
    },

    gameLost: function(boolArr)
    {
        let divPlayfield = document.getElementsByClassName("playfield")[0];
        let divOverlay = NodeFactory.createDivOverlay("You lose");
        divPlayfield.appendChild(divOverlay);

        this.firstSweep = 1;
        this.revealAllMines(boolArr);
    }
}

const NodeFactory =
{
    createDivPlayfield: function()
    {
        let divPlayfield = document.createElement("div");
        divPlayfield.classList.add("playfield");

        return divPlayfield;
    },

    createDivOverlay: function(text)
    {
        let divOverlay = document.createElement("div");
        let pOverlay = document.createElement("p");
        divOverlay.setAttribute("id", "overlay");
        pOverlay.setAttribute("id", "overlay_text");
        pOverlay.innerHTML = text;

        divOverlay.appendChild(pOverlay);

        return divOverlay;
    },

    createDivCell: function()
    {
        let divCell = document.createElement("div");
        divCell.classList.add("cells");
        divCell.classList.add("covered");
        divCell.setAttribute("id", "cell");

        return divCell;
    },

    setEventListenersOnCells: function()
    {
        const cells = document.querySelectorAll(".cells");
        cells.forEach(el => {
            el.addEventListener("click", (e) => {
                gameController.leftClickCell(e, el);
            });
            el.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                gameController.rightClickCell(e, el);
            });
            el.addEventListener("touchstart", (e) => {
                gameController.touchStartCell(e, el);
            });
            el.addEventListener("touchend", (e) => {
                gameController.touchEndCell(e, el);
            });
        });
    },

    setStyleForCells: function(divArrCells)
    {
        for(const cell of divArrCells)
        {
            // Create styles for small/medium/large
            //-------------------------------------
            const styles = [];
            styles[0] = "calc((100%/9 - 6px))";     // small
            styles[1] = "calc((100%/17 - 6px))";    // medium
            styles[2] = "calc((100%/25 - 6px))";    // large

            // Apply style
            //------------
            cell.style.width = styles[gameController.gameType];
            cell.style.height = styles[gameController.gameType];
        }
    },

    getElementByDataset: function(x, y)
    {
        return document.querySelector("[data-x='" + x.toString() + "'][data-y='" + y.toString() +"']");
    }
}

