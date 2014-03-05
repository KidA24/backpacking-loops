/// <reference path="~/Scripts/jquery-2.0.3.js" />


// Create an ElevationService.
var elevator = new google.maps.ElevationService();
var map;
var chart;
var infowindow = new google.maps.InfoWindow();
var polyline = new Array();
var dayNumber = 0;
var def = new Array();
var current_color = ['red', 'black', 'orange', 'purple', 'yellow', 'mediumvioletred', 'orangered'];
//data variable used for the elevation chart
var data = new google.visualization.DataTable();
data.addColumn('string', 'Sample');
data.addColumn('number', 'Elevation');
data.addColumn({ type: 'string', role: 'style' });
var testvar = 'initialize';
var pathReq = [];
var array_of_requests = [];
var deferred1;
var deferred2;
//used to store the individual days/paths for the trip
var trailPath = new Array([]);
var pathDistance = new Array();
var elevationPath = new Array();
var mapMarkers = new Array();
var legendPosition;
// Load the Visualization API and the columnchart package.
google.load('visualization', '1', { packages: ['corechart'] });
var metersToFeet = 3.28083989501312;

//handles the navigation of the actual links
function openNavigationLink(id) {
    $('#maincontent-maps').append(id);
    switch (id) {
        case 'flattopMtn':
            flatTopMountainWest();
            return;
        case 'eastLakeLoop':
            easternLakesLoop();
            return;
        case 'eastLakeLoop2':
            easternLakesLoop2Fn();
            return;
    }
}

function easternLakesLoop() {
    // Reset Data and path the currently selected data
    clearData();
    dayNumber = 0;
    var pathArray = [easternLakesLoop_Day1, easternLakesLoop_Day2, easternLakesLoop_Day3, easternLakesLoop_Day4];
    //calculate the daily distance of the route:
    deferredPaths = $.Deferred();
    calcTotalDistance(pathArray);
    moveMapLegend(google.maps.ControlPosition.LEFT_BOTTOM);
    inputPath(pathArray);
    dayNumber = 3;
    // Draw the map lines
    $.when(deferred1).done(drawPolyline());
    //Add the Markers
    for (var i = 0; i < easternLakesLoop_Markers.length; i++) {
        mapMarkers.push(easternLakesLoop_Markers[i]);
        mapMarkers[i].setMap(map);
    }

    //recenter the map
    map.panTo(new google.maps.LatLng(40.318279, -105.634728));
    //Add the Map Legend
    //$('#legend').css({ "height": "100px", "width": "200px", "background": "white" });
    addLegendCanvas();
    getElevations();
    /* TODO: Update Content!!
    $('#writtencontent').append(flatTopContent);
    $('#writtencontent').css('padding', '4px');
*/
}

function navigation() {
    var id = getid(this);
    openNavigationLink(id);
}

function initialize() {
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(40.278478, -105.753048),
        mapTypeId: 'terrain'
    }

    map = new google.maps.Map(document.getElementById('maincontent-maps'), mapOptions);

    // Create a new chart in the elevation_chart DIV.
    chart = new google.visualization.LineChart(document.getElementById('elevation_chart'));

    easternLakesLoop2Fn();
}

$(document).ready(function () {
    $('li.content').click(function () {
        $('li.content').removeClass("active");
        $(this).addClass('active');
    });
    $('li.leftNav').click(function () {
        $('li.leftNav').removeClass("active");
        $(this).addClass('active');
    });
    $('#RMNP').click(function () {
        $('#leftcolumn> div').hide();
        $('#rmnp_wrapper').show();
    });
    $('#glac').click(function () {
        $('#leftcolumn > div').hide();
        $('#glacier_stuff').show();
    });
    /* FlatTop is the proper super awesome format for this. Files are dynamically loaded and then
    the map is redrawn if it is successful. Can add more error handling if needed (?) */
    $('#flatTop').one("click", (function () {
        $flatTop = $(this);
        $.getScript("HTML/RMNP/flatTop.js", function (data, textStatus, jqxhr) {
            if (textStatus === 'success') {
                flatTopMountainWest();
            }
            $flatTop.on('click', flatTopMountainWest);
        });
    }));
    $('#eastLakes1').one("click", (function () {
        $eastLakes1 = $(this);
        $.getScript("HTML/RMNP/easternLakesLoop.js", function (data, textStatus, jqxhr) {
            if (textStatus === 'success') {
                easternLakesLoopFn();
            }
            $eastLakes1.on('click', easternLakesLoopFn);
        });
    }));
    $('#eastLakes2').one("click", (function () {
        $eastLakes2 = $(this);
        $.getScript("HTML/RMNP/easternLakesLoop2.js", function (data, textStatus, jqxhr) {
            if (textStatus === 'success') {
                easternLakesLoop2Fn();
            }
            $eastLakes2.on('click', easternLakesLoop2Fn);
        });
    }));

}); // end $(document).ready

$(document).load(initialize());


