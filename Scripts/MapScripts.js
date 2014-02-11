/// <reference path="~/Scripts/jquery-2.0.3.js" />


// Create an ElevationService.
var elevator = new google.maps.ElevationService();
var map;
var chart;
var infowindow = new google.maps.InfoWindow();
var polyline = new Array();
var dayNumber = 0;
var def = new Array();
var current_color = ['red', 'blue', 'orange', 'purple', 'yellow', 'black', 'green' ];
var data = new google.visualization.DataTable();
data.addColumn('string', 'Sample');
data.addColumn('number', 'Elevation');
data.addColumn({ type: 'string', role: 'style' });
var testvar = 'initialize';
var deferred1;
var deferred2;
var deferredPaths;
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
            //$('.GlacierNP-sub').toggle();
            return;
        case 'RMNP':
            $('.RockyMtn').toggle();
            return;
        case 'Wisconsin':
            //$('.Wisco').toggle();
            return;
        case '6plus':
            //$('plus6').toggle();
            return;
        case '3to5':
            //$('5to3').toggle();
            return;
        case '1or2':
            //$('2or1').toggle();
            return;
    }
}

//handles the navigation of the actual links
function openNavigationLink(id) {
    $('#maps').append(id);
    switch (id) {
        case 'flattopMtn':
            flatTopMountainWest();
            return;
        case 'numbertwo':
            chart.clearChart();
            return;
    }
}

function comingSoon() {
}

function clearData() {
    chart.clearChart();
    trailPath.length = 0;
    polyline.length = 0;
    elevationPath.length = 0;
    $('#writtencontent').empty();
    // Create an ElevationService.
    elevator = new google.maps.ElevationService();
    data = null;
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    data.addColumn({ type: 'string', role: 'style' });
    data.addColumn({ type: 'string', role: 'annotation' });

    dayNumber = 0;
}

function flatTopMountainWest() {
    // Reset Data and path the currently selected data
    clearData();
    dayNumber = 0;
    var pathArray = [flatTopDayOne, flatTopDayTwoOptional, flatTopDayTwo, flatTopDayThreeOpt2, flatTopDayFourOpt2];
    //calculate the daily distance of the route:
    deferredPaths = $.Deferred();
    calcTotalDistance(pathArray);
    inputPath(pathArray);
    dayNumber = 4;
    // Draw the map lines
    $.when(deferred1).done(drawPolyline());
    //Add the Markers
    for (var i = 0; i < flatTopMarkers.length; i++) {
        flatTopMarkers[i].setMap(map);
    }

    //Add the Map Legend
    $('#legend').css({ "height": "100px", "width": "100px", "background": "white" });
    addLegendCanvas();
    drawLegend();
    getElevations();
    $('#writtencontent').append(flatTopContent);
    $('#writtencontent').css('padding', '4px');
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
    //calculate the samples per day, as well as the entire path being used. 
    for (var i = 0; i < pathDistance.length; i++) {
        samplesPerDay[i] = Math.round(samplesPerMile * pathDistance[i]);
        totalSamples += samplesPerDay[i];
    }

    //Deferreds are used to make sure the data is all returned before drawing the chart. 
    deferred1 = $.Deferred();
    deferred2 = $.Deferred();
    

    //make individual path requests. 
    /*TODO: This is where the current issue is. 
        Need to make sure these requests are finished in sequence*/

    for (var i = 0; i < pathDistance.length; i++) {
        var pathReq = {
            'path': trailPath[i],
            'samples': samplesPerDay[i]
        }
        def.push($.Deferred());
        elevator.getElevationAlongPath(pathReq, elevationResults);

    }
      
    //Now input that data. 
    var current_samples = 0;
    //Draw the chart.
    $.when(deferred1).done(function () {
            console.log('elevationPath[0] is ' + elevationPath[0].toString());

        for (var i = 0; i < pathDistance.length; i++) {
            var cur_color = current_color[i];
            console.log('elevation starting day ' + (i + 1) + ' is ' + elevationPath[current_samples]);
            for (var j = current_samples; j < current_samples + samplesPerDay[i] - 1; j++) {
                data.addRow([' ', elevationPath[j], cur_color, undefined]);
            }
            data.addRow([' ', elevationPath[current_samples + samplesPerDay[i]], cur_color, 'Day ' + (i + 2).toString()]);
            current_samples += samplesPerDay[i];
        }
        deferred2.resolve();
    });
    
    $.when(deferred2).done(drawElevationChart);
}

function drawElevationChart() {
    document.getElementById('elevation_chart').style.display = 'block';
    chart.draw(data, {
        height: 200,
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
    console.log('returned value 0 is ' + (elevations[0].elevation * metersToFeet));
    
    for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].elevation*metersToFeet);
    }
    if (def[0]) {
        def[0].resolve();
        def.splice(0, 1);
    }
    if (!def[0]) {
        deferred1.resolve();
    }
    return;
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
        zoom: 12,
        center: new google.maps.LatLng(40.293275, -105.762661),
        mapTypeId: 'terrain'
    }

    map = new google.maps.Map(document.getElementById('maps'), mapOptions);

    // Create a new chart in the elevation_chart DIV.
    chart = new google.visualization.LineChart(document.getElementById('elevation_chart'));
    
    //add the legend
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('legend'));

    flatTopMountainWest();
}

//takes in an array of path's, and then calculates the total distance of the path
function calcTotalDistance(path) {
    for (var j = 0; j < path.length; j++) {
        pathDistance[j] = 0;
        for (var i = 1; i < path[j].length; i++) {
            pathDistance[j] += getDistanceFromLatLonInMi(path[j][i - 1].lat(), path[j][i - 1].lng(), path[j][i].lat(), path[j][i].lng());
        }
    }
}

function inputPath(path) {
    for (var i = 0; i < path.length; i++) {
        trailPath[i] = path[i];
    }
    deferredPaths.resolve();
}

function drawPolyline() {
    for (var i = 0; i <= dayNumber; i++) {
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
    $('#leftcolumn').load('HTML/LeftColumn.html');
    $(document).on('click', '.RockyMtn', navigation);
    $(document).on('click', '.GlacierNP-sub', navigation);
    $(document).on('click', '.topdropdown', function (e) {
        if ($(this).is($(e.target))) { topdropdown($(this)); };
    });
});

$(document).load(initialize());


