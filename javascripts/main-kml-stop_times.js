var date = new Date();
var counter = 1;


function KmlToGtfsShapesTimes(outputElement) {
  this._outputElement = outputElement;
  this._file = null;
  this._generateReverseShapes = false;

}

KmlToGtfsShapesTimes.prototype.setGenerateReverseShapes = function(enabled) {
  this._generateReverseShapes = enabled;
}

KmlToGtfsShapesTimes.prototype.handleFileSelect = function(files) {
  if (files.length != 1) {
    console.log('Expected just one file.');
    return false;
  }
  this._file = files[0];
  return true;
}

KmlToGtfsShapesTimes.prototype.convert = function() {
  if (!this._file) {
    console.log('no file specified');
    return;
  }

  this.writeHeader();

  var reader = new FileReader();
  var handleFileRead = this.handleFileRead.bind(this);
  reader.onload = function(e) {
    var text = reader.result;
    handleFileRead(text);
  }
  reader.readAsText(this._file);
};

KmlToGtfsShapesTimes.prototype.handleFileRead = function(text) {
  var parser = new DOMParser();
  var xml = parser.parseFromString(text,"text/xml");
  var placemarks = xml.getElementsByTagName('Placemark');
  for (var i = 0; i < placemarks.length; ++i) {
    this.processPlacemark(placemarks[i]);
  }
};

KmlToGtfsShapesTimes.prototype.processPlacemark = function(placemark) {
  var name = this.getElementByTagName(placemark, 'name');

  if (!name) {
    console.log("no name");
    return;
  }
var eData = this.getElementByTagName(placemark, 'ExtendedData');
  if(!eData){
    return;
  }

   var shData = this.getElementByTagName(eData, 'SchemaData');
   if(!shData){
    return;
  }
   var sData = shData.getElementsByTagName('SimpleData');

   if(!sData){
     return;
   }
   var trip = sData[2];

   if(!trip){
    console.log("no trip");
    return;
   }


  var point = this.getElementByTagName(placemark, 'Point');
  if (!point) {
    console.log("no point");
    return;
  }
  var coordinates = this.getElementByTagName(point, 'coordinates');
  if (!coordinates) {
    console.log("no coordinates");
    return;
  }
  var shapeId = name.textContent;
  var points = this.parseCoordinates(coordinates.textContent);
  this.writePoints(shapeId, points,trip);
  if (this._generateReverseShapes) {
    this.writePoints(shapeId + '-reverse', points.reverse());
  }
};

KmlToGtfsShapesTimes.prototype.getElementByTagName = function(element, name) {
  for (var i = 0; i < element.childNodes.length; ++i) {
    if (element.childNodes[i].nodeName == name) {
      return element.childNodes[i];
    }
  }
  return null;
};

KmlToGtfsShapesTimes.prototype.parseCoordinates = function(text) {
  var points = [];
  var tokens = text.split(" ");
  for (var i = 0; i < tokens.length; ++i) {
    var latlng = tokens[i].split(",");
    if (latlng.length < 2) {
      continue;
    }
    var point = {
      'lat': latlng[1],
      'lng': latlng[0]
    };
    points.push(point);
  }
  return points;
};

KmlToGtfsShapesTimes.prototype.writeHeader = function() {
  this._outputElement.value =
    'trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type\n';
};

KmlToGtfsShapesTimes.prototype.writePoints = function(shapeId, points,trip) {
  console.log("writing points");
  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    var d = new Date(1433246458982 + counter * 3000 * 60);
    d.setHours(07);
     var str = "";
    if(d.getMinutes() < 10){
       str = (d.getHours()< 10?"0"+d.getHours():d.getHours()) +":0"+d.getMinutes()+":"+d.getSeconds();
    }else{
       str = (d.getHours()< 10?"0"+d.getHours():d.getHours()) +":"+d.getMinutes()+":"+d.getSeconds();
    }
    
    var line = trip + ','+ str +  ','+ str+ ',' + shapeId + ',' + counter + ',,0,0\n';
    this._outputElement.value += line;
    counter++;
    
  }
}

function kml_to_gtfs_shapes_init_times() {
  var converter = new KmlToGtfsShapesTimes(document.getElementById('output'));

  document.getElementById('file').addEventListener(
    'change', function(event) {
      var ready = converter.handleFileSelect(event.target.files);
      document.getElementById('convert-button-stoptimes').disabled = !ready;
    });

  document.getElementById('generate-reverse-shapes').addEventListener(
    'change', function(event) {
      converter.setGenerateReverseShapes(event.target.checked);
    });

  document.getElementById('convert-button-stoptimes').addEventListener(
    'click', function(event) {
      converter.convert();
    });

}
