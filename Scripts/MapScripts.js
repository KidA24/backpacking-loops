﻿/// <reference path="~/Scripts/jquery-2.0.3.js" />

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setAllMap(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setAllMap(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    mapMarkers = [];
}

function setAllMap(map) {
    for (var i = 0; i < mapMarkers.length; i++) {
        mapMarkers[i].setMap(map);
    }
}

function clearData() {
    chart.clearChart();
    trailPath.length = 0;
    for (var i = 0; i < polyline.length; i++){
        polyline[i].setMap(null);
    }
    //clearMarkers();
    deleteMarkers();
    polyline.length = 0;
    elevationPath.length = 0;
    pathDistance.length = 0;
    $('#writtencontent').empty();
    // Create an ElevationService.
    elevator = new google.maps.ElevationService();
    data = null;
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    data.addColumn({ type: 'string', role: 'style' });
    data.addColumn({ type: 'string', role: 'annotation' });
    //clear legend
    if(document.getElementById("LegendCanvas")){
        var legend_canvas = document.getElementById("LegendCanvas");
        var legend_context = legend_canvas.getContext("2d");
        legend_context.clearRect(0, 0, 200, 100);
    }
    dayNumber = 0;
}

function addMainContent(content) {
    $('#maincontent-text').empty();
    for (var i = 0; i < content.length; i++) {
        $('#maincontent-text').append(content[i]);
    }
}

function easternLakesLoopFn() {
    // Reset Data and path the currently selected data
    clearData();
    dayNumber = 0;
    var pathArray = [easternLakesLoop.mainDayOne, easternLakesLoop.mainDayTwo, easternLakesLoop.mainDayThree, easternLakesLoop.mainDayFour];
    //calculate the daily distance of the route:
    deferredPaths = $.Deferred();
    calcTotalDistance(pathArray);
    moveMapLegend(google.maps.ControlPosition.LEFT_BOTTOM);
    inputPath(pathArray);
    dayNumber = 3;
    // Draw the map lines
    $.when(deferred1).done(drawPolyline());
    //Add the Markers
    for (var i = 0; i < easternLakesLoop.markers.length; i++) {
        mapMarkers.push(easternLakesLoop.markers[i]);
        mapMarkers[i].setMap(map);
    }

    //recenter the map
    map.panTo(new google.maps.LatLng(40.318279, -105.634728));
    //Add the Map Legend
    //$('#legend').css({ "height": "100px", "width": "200px", "background": "white" });
    addLegendCanvas();
    getElevations();
    addMainContent(easternLakesLoop.mainContent);
}

function easternLakesLoop2Fn() {
    // Reset Data and path the currently selected data
    clearData();
    var pathArray = [easternLakesLoop2.mainDayOne, easternLakesLoop2.mainDayTwo, easternLakesLoop2.mainDayThree, easternLakesLoop2.mainDayFour, easternLakesLoop2.mainDayFive];
    //calculate the daily distance of the route:
    deferredPaths = $.Deferred();
    calcTotalDistance(pathArray);
    moveMapLegend(google.maps.ControlPosition.LEFT_BOTTOM);
    inputPath(pathArray);
    dayNumber = 4;
    // Draw the map lines
    $.when(deferred1).done(drawPolyline());
    //Add the Markers
    for (var i = 0; i < easternLakesLoop2.markers.length; i++) {
        mapMarkers.push(easternLakesLoop2.markers[i]);
        mapMarkers[i].setMap(map);
    }

    //recenter the map
    map.panTo(new google.maps.LatLng(40.304142, -105.661196));
    //Add the Map Legend
    //$('#legend').css({ "height": "100px", "width": "200px", "background": "white" });
    addLegendCanvas();
    getElevations();
    addMainContent(easternLakesLoop2.mainContent);
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
    
    //sets up an array of requests to be made in order for the elevation chart
    for (var i = 0; i < pathDistance.length; i++) {
        pathReq[i] = {
            'path': trailPath[i],
            'samples': samplesPerDay[i]
        }
        if (i > 0) {
            var pr = pathReq[i];
            array_of_requests.push(elevatorWrapper(pr, elevationResults));
        }
    }
    var pr = pathReq[0];
    elevator.getElevationAlongPath(pr, elevationResults);

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
    
    $.when(deferred2).done(function () { drawElevationChart(); drawLegend(samplesPerDay)});
}


function elevatorWrapper(pr, elevationResults) {
    return function () {
        elevator.getElevationAlongPath(pr, elevationResults);
    };
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
        return $.Deferred().reject;
    }
    var elevations = results;
    var next_call = array_of_requests.shift();
    console.log('returned value 0 is ' + (elevations[0].elevation * metersToFeet));
    
    for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].elevation*metersToFeet);
    }
    if (next_call) {
        next_call();
    }
    else if (!next_call) {
        deferred1.resolve();
    }
}

function calcDailyElevGainsLosses(samplesPerDay) {
    var eleGains = [];
    var eleLoss = [];
    var counter = 1;
    for (var i = 0; i < samplesPerDay.length; i++) {
        eleGains[i] = 0;
        eleLoss[i] = 0;
        for (var j = counter; j < samplesPerDay[i] + counter; j++) {
            if (elevationPath[j] > elevationPath[j - 1]) {
                eleGains[i] += (elevationPath[j] - elevationPath[j-1]);
            }
            if (elevationPath[j] < elevationPath[j - 1]) {
                eleLoss[i] += (elevationPath[j-1] - elevationPath[j]);
            }
        }
        eleGains[i] = Math.round(eleGains[i]);
        eleLoss[i] = Math.round(eleLoss[i]);
        counter += samplesPerDay[i];
    }
    var gainLoss = [eleGains, eleLoss];
    return gainLoss;
}

function drawLegend(samplesPerDay) {
    var gainLoss = calcDailyElevGainsLosses(samplesPerDay);
    var totDays = dayNumber + 1;
    var spacing = 80/totDays;
    var legend_canvas = document.getElementById("LegendCanvas");
    var legend_context = legend_canvas.getContext("2d");
    legend_context.fillStyle = 'black';
    legend_context.fillText("Dist (mi)", 50, 12);
    legend_context.fillText("Elev Gain/Loss (ft)", 100, 12);
    legend_context.moveTo(0, 15);
    legend_context.lineTo(200, 15);
    legend_context.strokeStyle = 'black';
    legend_context.stroke();
    //Add key, lines and mileage per day
    for (var i = 1; i <= totDays; i++) {
        var dist = pathDistance[i-1]
        dist = dist * 100;
        dist = Math.round(dist);
        dist = dist / 100;
        legend_context.fillStyle = 'black';
        legend_context.fillText("Day " + i + ":", 5, 27 + (i - 1) * spacing);
        legend_context.fillText(gainLoss[0][i - 1] + " / " + gainLoss[1][i - 1], 110, 27 + (i - 1) * spacing);
        legend_context.fillText(dist.toFixed(2), 60, 27 + (i - 1) * spacing);
        legend_context.fillStyle = current_color[i - 1];
        legend_context.fillRect(40, 22 + (i - 1) * spacing, 17, 4);
    }
}

function addLegendCanvas() {
    var div = document.getElementById('legend');
    if(div.firstChild) 
        return;

    var canvas = document.createElement('canvas');
    
    canvas.id = "LegendCanvas";
    canvas.width = 200;
    canvas.height = 100;
    canvas.style.zIndex = 8;
    canvas.style.position = "absolute";
    canvas.style.border = "1px solid";
    div.appendChild(canvas);
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

function moveMapLegend(newPosition) {
    if (!legendPosition) {
        map.controls[newPosition].push(document.getElementById('legend'));
        legendPosition = newPosition;
        return;
    }
        //don't do any work if it is already in the right spot
    else if (legendPosition == newPosition){
        return;
    }
        //if they are not the same position, remove old one and re add to the new position
    else if (legendPosition != newPosition) {
        var div = document.getElementById('legend');
        var index = map.controls[legendPosition].indexOf(div);
        if (index > -1) {
            map.controls[legendPosition].pop();
        }
        map.controls[newPosition].push(div);
        legendPosition = newPosition;
        return;
    }
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
            strokeWeight: dayNumber+3-i,
            strokeOpacity: 0.9,
            map: map
        });
    }
}


