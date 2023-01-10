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
    init: async function()
    {
        this.divContent = document.body.getElementsByClassName("content");
        this.divPlayfield = document.body.getElementsByClassName("playfield");
        this.defineBody();
        this.defineHeader(this.divContent[0]);
        this.definePlayfield(this.divContent[0]);
        this.defineButtons(this.divContent[0], this.divPlayfield[0]);
        this.defineFooter(this.divContent[0]);
        await remoteGameController.init(0, this.divPlayfield[0]);
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

        remoteGameController.init(0, divPlayfield);

        divContent.appendChild(divPlayfield);
    },

    defineButtons: function(divContent, divPlayfield)
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

        // Add click-Events for the buttons
        //---------------------------------
        btnSmall.addEventListener("click", (event) => remoteGameController.init(0, divPlayfield));
        btnMedium.addEventListener("click", (event) => remoteGameController.init(1, divPlayfield));
        btnLarge.addEventListener("click", (event) => remoteGameController.init(2, divPlayfield));
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
}

const remoteGameController =
{
    // Functions
    //----------
    token: 0,
    userID: 0,
    numCells: 0,
    numMines: 0,
    firstSweep: 0,
    size: 0,

    init: async function(size, divPlayfield)
    {
        this.url = "https://www2.hs-esslingen.de/~melcher/internet-technologien/minesweeper/";
        this.userID = "seceit01";
        this.numCells = (9+size*8)**2;
        this.numMines = 15+size*50;
        this.firstSweep = 1;
        this.size = size;

        let rowNum = Math.sqrt(this.numCells);

        let request = `${this.url}?request=init&userid=${this.userID}&size=${rowNum}&mines=${this.numMines}`
        let response = await this.fetchAndDecode(request);

        this.token = response.token;

        // Empty the playfield
        //--------------------
        divPlayfield.innerHTML = '';

        // Insert cells into playfield
        //----------------------------
        let divCell = NodeFactory.createDivCell();
        let y = -1;
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

    fetchAndDecode: async function(request)
    {
        try
        {
            let res = await fetch(request);
            return await res.json();
        }
        catch (error)
        {
            console.log(error);
        }
    },

    sweep: async function(x, y)
    {
        let request = `${this.url}?request=sweep&token=${this.token}&x=${x}&y=${y}`;
        let response = await this.fetchAndDecode(request);
        let el = NodeFactory.getElementByDataset(x, y);

        this.uncoverCell(response, el);
    },

    leftClickCell: function(event, el)
    {
        if(!this.cellHasFlag(el))
            this.sweep(el.dataset.x, el.dataset.y);
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
    cellHasFlag: function(el)
    {
        let temp_el = NodeFactory.getElementByDataset(el.dataset.x, el.dataset.y);
        return (temp_el.classList.contains("mark_flag") ? true : false);
    },

    cellHasMine: function(boolArr, el)
    {
        if(boolArr[el.dataset.x][el.dataset.y]) return true;
    },

    uncoverCell: function(response, el)
    {
        if(response.minehit)
        {
            this.markMine(el);
            this.gameEnd(response.mines, "You lose");
        }
        else
        {
            let mineCount = response.minesAround;
            (0 == mineCount) ? this.uncoverEmptyCells(response.emptyCells) : this.markCell(el, mineCount);
        }

        if(response.userwins)
            this.gameEnd(response.mines, "You won");
    },

    uncoverEmptyCells: function(emptyCells)
    {
        for(let cell of emptyCells)
        {
            let el = NodeFactory.getElementByDataset(cell.x, cell.y);
            this.markCell(el, cell.minesAround);
        }
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
        // Toggle mark flag
        //-----------------
        if(el.classList.contains("mark_flag"))
            el.classList.remove("mark_flag");
        // Do nothing on uncovered cells
        //------------------------------
        else if(!el.classList.contains("covered"))
            return;
        else
            el.classList.add("mark_flag");
    },

    markMine: function(el)
    {
        el.classList.remove("covered");
        el.classList.add("mark_mine");
    },

    revealAllMines: function(mines)
    {
        for(let mine of mines)
        {
            let el = NodeFactory.getElementByDataset(mine.x, mine.y);
            this.markMine(el);
        }
    },

    gameEnd: function(mines, text)
    {
        let divPlayfield = document.getElementsByClassName("playfield")[0];
        let divOverlay = NodeFactory.createDivOverlay(text);
        divPlayfield.appendChild(divOverlay);

        this.firstSweep = 1;
        this.revealAllMines(mines);
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
                remoteGameController.leftClickCell(e, el);
            });
            el.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                remoteGameController.rightClickCell(e, el);
            });
            el.addEventListener("touchstart", (e) => {
                remoteGameController.touchStartCell(e, el);
            });
            el.addEventListener("touchend", (e) => {
                remoteGameController.touchEndCell(e, el);
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
            cell.style.width = styles[remoteGameController.size];
            cell.style.height = styles[remoteGameController.size];
        }
    },

    getElementByDataset: function(x, y)
    {
        return document.querySelector("[data-x='" + x.toString() + "'][data-y='" + y.toString() +"']");
    }
}

