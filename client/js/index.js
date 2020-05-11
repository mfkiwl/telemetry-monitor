/*---------------------------------------------------------------------------------------------------*/
let GLOBS = (function() {
    return {
        // position accuracy multiplier
        covarianceMult: 10, // GNSS uncertainty multiplier
        mapZoom: 18,
        maxPointsDraw: 1000, // map threshold
        globThin: 10,
        newGlobThin: 10,
        batchT: 1, // in sec.
        batchSize: 10, // initial animation batch size
        newBatchSize: 10,
        globTimeoutMs: 250,
        stopFlag: false,
        rangeChanged: false,

        // buttons 
        playBtn: document.getElementById("play"),
        stopBtn: document.getElementById("stop"),
        serverBtn: document.getElementById("server-start-button"),
        slider: document.querySelector('input[name=range-input]'),

        // file upload
        fileInput: document.getElementById("inp-file"),
        fileInputBtn: document.getElementById("inp-file-button"),

        fileProcessor: new processDataFile(),

        rangeVal: document.getElementById("range-output"),
        range: document.getElementById("range-freq"),

        // Init graphs
        altChart: new myChart(ylabel="Alt, m", chartName='alt-chart', title="Altitude"),
        prChart: new myChart(ylabel="Angle, rad.", chartName='pr-chart', title="Pitch/Roll"),
        yawChart: new myChart(ylabel="Angle, rad.", chartName='yaw-chart', title="Yaw"),
        posChart: new myChart(ylabel="Pos., m", chartName='pos-chart', title="pos_accuracy"),
        velChart: new myChart(ylabel="V, m/s", chartName='vel-chart', title="vel_accuracy"),
        numsatChart: new myChart(ylabel="#", chartName='numsat-chart', title="num_satelites"),

        resetZoom: document.getElementById("zoom-reset"),

        // maps globals
        currentMap: undefined,
        mapView: undefined,
        sceneView: undefined,
        Graphic: undefined,
        graphicsLayer: undefined,
        Point: undefined,
        multiPoint: undefined,

        drawingFinished: {
            valInternal: false,
            valListener: function(val) {},
            set flag(val) {
              this.valInternal = val;
              this.valListener(val);
            },
            get flag() {
              return this.valInternal;
            },
            registerListener: function(listener) {
              this.valListener = listener;
            }
          }
    }
}());

GLOBS.fileInputBtn.onclick = function(e) {
    GLOBS.fileInput.click();
};

// freq. input
let freqValues = [1,2,5,10,20,50,100];
let maxFreq = 100;
GLOBS.range.oninput = function(e) {
    GLOBS.rangeVal.innerHTML = `${freqValues[GLOBS.range.value]} Hz`;
    GLOBS.newGlobThin = Math.floor(maxFreq / freqValues[GLOBS.range.value]);
    GLOBS.newBatchSize = Math.max(2, Math.floor(GLOBS.batchT / (1/freqValues[GLOBS.range.value])));
    GLOBS.fileInput.value = ""; // to be able to reopen the file
};

GLOBS.resetZoom.onclick = function(e) {
    GLOBS.altChart.chart.resetZoom();
    GLOBS.prChart.chart.resetZoom();
    GLOBS.yawChart.chart.resetZoom();
    GLOBS.posChart.chart.resetZoom();
    GLOBS.velChart.chart.resetZoom();
    GLOBS.numsatChart.chart.resetZoom();
};

/*---------------------------------------------------------------------------------------------------*/

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", 
         "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Multipoint"], 
        function(Map, MapView, SceneView, GraphicClass, GraphicsLayer, PointClass, MultipointClass) {
    GLOBS.currentMap = new Map({basemap: "streets-night-vector"});
    GLOBS.sceneView = new SceneView({
        container: "map-view",
        map: GLOBS.currentMap,
        zoom: 12,
        center: [11.5820, 48.1351]
    });
    GLOBS.graphicsLayer = new GraphicsLayer();
    GLOBS.currentMap.add(GLOBS.graphicsLayer);

    GLOBS.Graphic = GraphicClass;
    GLOBS.Point = PointClass;
    GLOBS.multiPoint = MultipointClass;
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/

GLOBS.fileInput.onchange = function(e) {
    if (GLOBS.fileInput.value) {
        // Rename button or text later ?
        // fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
        GLOBS.globThin = GLOBS.newGlobThin;
        GLOBS.batchSize = GLOBS.newBatchSize;
        loadDataFile();
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/

/*----------------------------------------- Offline Player -------------------------------------------*/

// add listener to GLOBS.drawingFinished object
GLOBS.drawingFinished.registerListener(function(val) {
    if (val) {
        GLOBS.fileProcessor.drawLastCone();
        GLOBS.fileProcessor.batchSize = null;
        GLOBS.stopFlag = false;
        playClicked = false;
        playerEnableBtns();
        changeBtnStatus(GLOBS.playBtn, "playColor", disabled=false, color=`#aaaaaa`, hoverColor=`#bbbbbb`);
        document.getElementById("play-button-img").src = "./img/play-bold.png";
    }
});

let playClicked = false;
GLOBS.playBtn.onclick = async function(e) {
    if (GLOBS.fileProcessor.parsedCsv) {
        changeBtnStatus(GLOBS.playBtn, "playColor", disabled=false, color=`#bbbbbb`, hoverColor=`#bbbbbb`);
        if (!playClicked) {
            playClicked = true;
            document.getElementById("play-button-img").src = "./img/pause-bold.png";
            playerDisableBtns();
            GLOBS.fileProcessor.batchSize = GLOBS.batchSize;
            if (!GLOBS.stopFlag) {
                GLOBS.fileProcessor.clearDrawing();
                GLOBS.fileProcessor.initVars(false);
                GLOBS.fileProcessor.startdraw();
                GLOBS.drawingFinished.flag = false;
                drawPause(GLOBS.fileProcessor);
            } else {
                drawPause(GLOBS.fileProcessor);
            }
        } else {
            playClicked = false;
            document.getElementById("play-button-img").src = "./img/play-bold.png";
            if (!GLOBS.drawingFinished.flag) {
                GLOBS.stopFlag = true;
                stopAnimation();
            }
        }
    }
};

const stopSw = new Stopwatch();
GLOBS.stopBtn.onclick = function(e) {
    if (GLOBS.fileProcessor.parsedCsv) {
        playerEnableBtns();
        if (!GLOBS.drawingFinished.flag) {
            switchCoverSpin(true);
            stopSw.start();
            stopAnimation();
            GLOBS.fileProcessor.batchSize = null;
            GLOBS.fileProcessor.iterDraw();
            stopSw.stop();
            GLOBS.stopFlag = false;
            setTimeout(() => switchCoverSpin(false), 
                    stopSw.duration <= 1.0 ? 1000 : 10);
            stopSw.reset();
            playClicked = false;
        }
    }
};

/*----------------------------------------- Offline Player -------------------------------------------*/

/*-------------------------------------- Server Communication ----------------------------------------*/

let serverBtnState = false;
GLOBS.serverBtn.onclick = function(e) {
    serverBtnState = serverBtnState ? false : true;
    if (serverBtnState) {
        changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=true, color=`#888`, hoverColor=`#888`);
        changeBtnStatus(GLOBS.slider, "sliderColor", disabled=true, color=`#888`, hoverColor=`#888`);
        changeBtnStatus(GLOBS.slider, "trackColor", disabled=true, color=`#888`, hoverColor=`#888`);
        GLOBS.playBtn.disabled = true;
        GLOBS.stopBtn.disabled = true;
        GLOBS.range.disabled = true;
        changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=false, color=`#fc3503`, hoverColor=`#fc3503`);
        GLOBS.serverBtn.innerHTML = "Close";
    } else {
        changeBtnStatus(GLOBS.fileInputBtn, "inpBtnColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
        changeBtnStatus(GLOBS.slider, "sliderColor", disabled=false, color=`#f1f1f1`, hoverColor=`#f1f1f1`);
        changeBtnStatus(GLOBS.slider, "trackColor", disabled=false, color=`#639fff`, hoverColor=`#639fff`);
        GLOBS.playBtn.disabled = false;
        GLOBS.stopBtn.disabled = false;
        GLOBS.range.disabled = false;
        changeBtnStatus(GLOBS.serverBtn, "sendColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
        GLOBS.serverBtn.innerHTML = "Open";
    }
}

// Use later as an example of input forms 
// rangeVal.addEventListener("click", () => {
//     rangeVal.value = "";
// });
// rangeVal.addEventListener("keyup", function(event) {
//     event.preventDefault();
//     if (event.keyCode === 13) {
//         range.value = rangeVal.value;
//         rangeVal.value = `${rangeVal.value} Hz`;
//         updateThinFromRange();
//     }
// });

/*-------------------------------------- Server Communication ----------------------------------------*/
