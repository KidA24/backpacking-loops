/// <reference path="~/scripts/jquery-2.0.3.js" />


// Create an ElevationService.
var elevator = new google.maps.ElevationService();
var map;
var chart;
var infowindow = new google.maps.InfoWindow();
var polyline = new Array();
var dayNumber = 0;
var current_color = ['red', 'blue', 'orange', 'purple', 'yellow', 'black', 'green' ];
var data = new google.visualization.DataTable();
data.addColumn('string', 'Sample');
data.addColumn('number', 'Elevation');
data.addColumn({ type: 'string', role: 'style' });
var testvar = 'initialize';
//used to store the individual days/paths for the trip
var trailPath = new Array([]);
var pathDistance = new Array();
var elevationPath = new Array();
// Load the Visualization API and the columnchart package.
google.load('visualization', '1', { packages: ['corechart'] });
var metersToFeet = 3.28083989501312;

//handles the toggling of the drop downs 
function togglevisible(id) {
    switch (id) {
        case 'GlacierNP':
            $('.GlacierNP-sub').toggle();
            return;
        case 'RMNP':
            $('.RockyMtn').toggle();
            return;
        case 'Wisconsin':
            $('.Wisco').toggle();
            return;
        case '6plus':
            $('plus6').toggle();
            return;
        case '3to5':
            $('5to3').toggle();
            return;
        case '1or2':
            $('2or1').toggle();
            return;
    }
}

function clearData() {
    chart.clearChart();
    
    while(polyline.length > 0) {
        if (polyline[0]) {
            polyline[0].setMap(null);
            polyline.splice(0, 1);
            console.log(polyline.length);
        }
    };

    while (trailPath.length > 0) {
        trailPath.pop();
    };


    // Create an ElevationService.
    elevator = new google.maps.ElevationService();
    data = null;
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    data.addColumn({ type: 'string', role: 'style' });
    data.addColumn({ type: 'string', role: 'annotation' });

   // pathDistance = 0;
    dayNumber = 0;
    console.log('data cleared');
}

function highline() {
    // Reset Data and path the currently selected data
    clearData();
    dayNumber = 0;
    drawPath(flatTopDayOne);
    calcTotalDistance(flatTopDayOne);
    dayNumber += 1;
    drawPath(flatTopDayTwo);
    calcTotalDistance(flatTopDayTwo);
    dayNumber += 1;
    drawPath(flatTopDayThree);
    calcTotalDistance(flatTopDayThree);

    // Draw the map lines
    drawPolyline();

    //Add the Markers
    for (var i = 0; i < flatTopMarkers.length; i++) {
        flatTopMarkers[i].setMap(map);
    }

    //Add the Map Legend
    $('#legend').css({ "height": "100px", "width": "100px", "background": "white" });
    addLegendCanvas();
    drawLegend();
    getElevations();
}

//determines number of samples per path, and then deposits the results into an array of altitudes. 
function getElevations() {
    //find total length of the path, and the percentage each day has. 
    var dailyPercent = new Array();
    var samplesPerDay = new Array();
    var totalLength = 0;
    var totalSamples = 0;
    for (var i = 0; i < pathDistance.length; i++) {
        totalLength += pathDistance[i];
    }
    var samplesPerMile = 500 / totalLength;
    var fullPath = new Array();
    //calculate the samples per day, as well as the entire path being used. 
    for (var i = 0; i < pathDistance.length; i++) {
        samplesPerDay[i] = Math.round(samplesPerMile * pathDistance[i]);
        fullPath = fullPath.concat(trailPath[i]);
        totalSamples += samplesPerDay[i];
    }
    //make 500 point elevation path request with the full trail path and save it to elevationPath global variable
    var pathReq = {
        'path': fullPath,
        'samples': totalSamples
    }
    console.log(totalSamples);
    elevator.getElevationAlongPath(pathReq, elevationResults);
    //Now input that data. 
    var current_samples = 0;
    for (var i = 0; i < pathDistance.length; i++) {
        var cur_color = current_color[i];
        for (var j = current_samples; j < current_samples + samplesPerDay[i] - 1; j++) {
            data.addRow([' ', elevationPath[j], cur_color, undefined]);
        }
        if(i != pathDistance.length - 1){
            data.addRow([' ', elevationPath[current_samples + samplesPerDay[i]], cur_color, 'Day ' + (i + 2).toString()]);
        }
        current_samples += samplesPerDay[i];
    }
    
    //Draw the chart.
    document.getElementById('elevation_chart').style.display = 'block';
    chart.draw(data, {
        height: 150,
        legend: 'none',
        titleY: 'Elevation (ft)',
        annotations: { style: 'line', textStyle: { color: 'black' } }
    });
}

function elevationResults(results, status) {
    if (status != google.maps.ElevationStatus.OK) {
        return;
    }
    var elevations = results;
    for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].elevation*metersToFeet);
    }
    console.log('results length is ' + results.length);
    console.log('elevationPath length is ' + elevationPath.length);
}

function drawLegend() {

    var totDays = dayNumber + 1;
    var spacing = 10;
    if (totDays < 5) {
        spacing = 20;
    }
    var legend_canvas = document.getElementById("LegendCanvas");
    var legend_context = legend_canvas.getContext("2d");
    legend_context.fillStyle = 'black';
    legend_context.fillText("Legend", 30, 12);
    legend_context.moveTo(0, 15);
    legend_context.lineTo(100, 15);
    legend_context.strokeStyle = 'black';
    legend_context.stroke();
    //Add key, lines and mileage per day
    for (var i = 1; i <= totDays; i++) {
        var round = pathDistance[i-1]
        round = round*100;
        round = Math.round(round);
        round = round/100;
        legend_context.fillStyle = 'black';
        legend_context.fillText("Day " + i + ":", 5, 27 + (i - 1) * spacing);
        legend_context.fillText(round.toFixed(2) + ' mi', 60, 27 + (i - 1) * spacing);
        legend_context.fillStyle = current_color[i - 1];
        legend_context.fillRect(40, 22 + (i - 1) * spacing, 17, 4);

    }
        

}

function addLegendCanvas() {
    var canvas = document.createElement('canvas');
    div = document.getElementById('legend');
    canvas.id = "LegendCanvas";
    canvas.width = 100;
    canvas.height = 100;
    canvas.style.zIndex = 8;
    canvas.style.position = "absolute";
    canvas.style.border = "1px solid";
    div.appendChild(canvas)
}

function getDistanceFromLatLonInMi(lat1, lon1, lat2, lon2) {
    var R = 3963.1676; // Radius of the earth in miles
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in miles
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

//handles the navigation of the actual links
function openNavigationLink(id) {
    $('#maps').append(id);
    switch (id) {
        case 'highline':
            highline();
            return;
        case 'numbertwo':
            chart.clearChart();
            return;
    }
}

function getid(selectedItem) {
    if ($(selectedItem).attr('id') != null) {
        return $(selectedItem).attr('id');
    }
}

function topdropdown(that) {
    var id = getid(that);
    togglevisible(id);
}

function navigation() {
    var id = getid(this);
    openNavigationLink(id);
}

function initialize() {
    var mapOptions = {
        zoom: 11,
        center: new google.maps.LatLng(40.257599,-105.800072),
        mapTypeId: 'terrain'
    }
    map = new google.maps.Map(document.getElementById('maps'), mapOptions);

    // Create a new chart in the elevation_chart DIV.
    chart = new google.visualization.LineChart(document.getElementById('elevation_chart'));
    
    //add the legend
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('legend'));

    highline();
}

function calcTotalDistance(path) {
    var fff = dayNumber;
    pathDistance[dayNumber] = 0;
    for (var i = 1; i < path.length; i++){
        pathDistance[dayNumber] += getDistanceFromLatLonInMi(path[i - 1].lat(), path[i - 1].lng(), path[i].lat(), path[i].lng());
    }
}

function drawPath(path) {
    if (!trailPath[dayNumber]) {
        trailPath[dayNumber] = [];
    }
    for (var i = 0; i < path.length; i++) {
        trailPath[dayNumber].push(path[i]);
    }
}

function drawPolyline() {
    for (var i = 0; i <= dayNumber; i++) {

        console.log('i equals ' + i);
        console.log('trailPath Length equals ' + trailPath[i].length);
        polyline[i] = new google.maps.Polyline({
            path: trailPath[i],
            strokeColor: current_color[i],
            strokeWeight: 2,
            strokeOpacity: 0.9,
            map: map
        });
    }
}

$(document).ready(function () {
    $('#rightcolumn').load('HTML/About.html');
    $('#leftcolumn').load('HTML/LeftColumn.html');
    $(document).on('click', '.GlacierNP-sub', navigation);
    $(document).on('click', '.topdropdown', function (e) {
        if ($(this).is($(e.target))) { topdropdown($(this)); };
    });
});

$(document).load(initialize());


