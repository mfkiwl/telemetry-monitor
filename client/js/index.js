/*---------------------------------------------------------------------------------------------------*/
// position accuracy multiplier
let globPosMult = 2;
let globThin = 10;

// buttons 
playBtn = document.getElementById("play");
pauseBtn = document.getElementById("pause");
stopBtn = document.getElementById("stop");
const serverBtn = document.getElementById("server-start-button");
const slider = document.querySelector('input[name=range-input]');

// text io
// TO DO

// file upload
const fileInput = document.getElementById("inp-file");
const fileInputBtn = document.getElementById("inp-file-button");
fileInputBtn.onclick = function(e) {
    fileInput.click();
};

// freq. input
let freqValues = [1,2,5,10,20,50,100];
let maxFreq = 100;
const range = document.getElementById("range-freq");
const rangeVal = document.getElementById("range-output");
range.oninput = function(e) {
    rangeVal.innerHTML = `${freqValues[range.value]} Hz`;
    globThin = Math.floor(maxFreq / freqValues[range.value]);
    fileInput.value = "";
};

// Init graphs
let altChart = new myChart(ylabel="Alt, m", chartName='alt-chart', title="Altitude");
let prChart = new myChart(ylabel="Angle, rad.", chartName='pr-chart', title="Pitch/Roll");
let yawChart = new myChart(ylabel="Angle, rad.", chartName='yaw-chart', title="Yaw");
let posChart = new myChart(ylabel="Pos., m", chartName='pos-chart', title="pos_accuracy");
let velChart = new myChart(ylabel="V, m/s", chartName='vel-chart', title="vel_accuracy");
let numsatChart = new myChart(ylabel="#", chartName='numsat-chart', title="num_satelites");

const resetZoom = document.getElementById("zoom-reset");
resetZoom.onclick = function(e) {
    altChart.chart.resetZoom();
    prChart.chart.resetZoom();
    yawChart.chart.resetZoom();
    posChart.chart.resetZoom();
    velChart.chart.resetZoom();
    numsatChart.chart.resetZoom();
};

/*---------------------------------------------------------------------------------------------------*/

/*-------------------------------------------- ArcGIS -----------------------------------------------*/
// maps globals
let currentMap;
let mapView;
let sceneView;
let Graphic;
let graphicsLayer;
let Point;
let multiPoint;

// initialize ArcGIS map
require(["esri/Map", "esri/views/MapView", "esri/views/SceneView", "esri/Graphic", 
         "esri/layers/GraphicsLayer", "esri/geometry/Point", "esri/geometry/Multipoint"], 
        function(Map, MapView, SceneView, GraphicClass, GraphicsLayer, PointClass, MultipointClass) {
    currentMap = new Map({basemap: "streets-night-vector"});
    sceneView = new SceneView({
        container: "map-view",
        map: currentMap,
        zoom: 12,
        center: [11.5820, 48.1351]
    });
    graphicsLayer = new GraphicsLayer();
    currentMap.add(graphicsLayer);

    Graphic = GraphicClass;
    Point = PointClass;
    multiPoint = MultipointClass;
});

/*-------------------------------------------- ArcGIS -----------------------------------------------*/

/*-------------------------------------------- Graphs -----------------------------------------------*/

// read file callback
const sw = new Stopwatch();
fileInput.onchange = function(e) {
    if (fileInput.value) {
        // Rename button or text later ?
        // fileInputText.innerHTML = fileInput.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];

        switchCoverSpin(true);
        sw.start();
        processData(batchSize=null);
        sw.start();

        setTimeout(() => switchCoverSpin(false), 
                   sw.duration <= 1.0 ? 1000 : 10);
        sw.reset();
    } 
};

/*-------------------------------------------- Graphs -----------------------------------------------*/

/*----------------------------------------- Offline Player -------------------------------------------*/

let batchSize = Math.floor(2/(1/globThin));
playBtn.onclick = function(e) {
    changeBtnStatus(slider, "sliderColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(slider, "trackColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(serverBtn, "sendColor", disabled=true, color=`#888`, hoverColor=`#888`);
    changeBtnStatus(fileInputBtn, "inpBtnColor", disabled=true, color=`#888`, hoverColor=`#888`);
    range.disabled = true;

    processData(batchSize);
};

stopBtn.onclick = function(e) {
    changeBtnStatus(slider, "sliderColor", disabled=false, color=`#f1f1f1`, hoverColor=`#f1f1f1`);
    changeBtnStatus(slider, "trackColor", disabled=false, color=`#639fff`, hoverColor=`#639fff`);
    changeBtnStatus(serverBtn, "sendColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
    changeBtnStatus(fileInputBtn, "inpBtnColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
    range.disabled = false;
};

pauseBtn.onclick = function(e) {
    //...
}

/*----------------------------------------- Offline Player -------------------------------------------*/

/*-------------------------------------- Server Communication ----------------------------------------*/

let serverBtnState = false;
serverBtn.onclick = function(e) {
    serverBtnState = serverBtnState ? false : true;

    if (serverBtnState) {
        changeBtnStatus(fileInputBtn, "inpBtnColor", disabled=true, color=`#888`, hoverColor=`#888`);
        changeBtnStatus(slider, "sliderColor", disabled=true, color=`#888`, hoverColor=`#888`);
        changeBtnStatus(slider, "trackColor", disabled=true, color=`#888`, hoverColor=`#888`);
        playBtn.disabled = true;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        range.disabled = true;
        changeBtnStatus(serverBtn, "sendColor", disabled=false, color=`#fc3503`, hoverColor=`#fc3503`);
        serverBtn.innerHTML = "Close";
    } else {
        changeBtnStatus(fileInputBtn, "inpBtnColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
        changeBtnStatus(slider, "sliderColor", disabled=false, color=`#f1f1f1`, hoverColor=`#f1f1f1`);
        changeBtnStatus(slider, "trackColor", disabled=false, color=`#639fff`, hoverColor=`#639fff`);
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        range.disabled = false;
        changeBtnStatus(serverBtn, "sendColor", disabled=false, color=`#009578`, hoverColor=`#00b28f`);
        serverBtn.innerHTML = "Open";
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
