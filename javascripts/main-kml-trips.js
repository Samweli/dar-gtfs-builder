function KmlToGtfsShapesTrip(outputElement) {
  this._outputElement = outputElement;
  this._file = null;
  this._generateReverseShapes = false;
}

KmlToGtfsShapesTrip.prototype.setGenerateReverseShapes = function(enabled) {
  this._generateReverseShapes = enabled;
}

KmlToGtfsShapesTrip.prototype.handleFileSelect = function(files) {
  if (files.length != 1) {
    console.log('Expected just one file.');
    return false;
  }
  this._file = files[0];
  return true;
}

KmlToGtfsShapesTrip.prototype.convert = function() {
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

KmlToGtfsShapesTrip.prototype.handleFileRead = function(text) {
  var parser = new DOMParser();
  var xml = parser.parseFromString(text,"text/xml");
  var placemarks = xml.getElementsByTagName('Placemark');
  for (var i = 0; i < placemarks.length; ++i) {
    this.processPlacemark(placemarks[i]);
  }
};

KmlToGtfsShapesTrip.prototype.processPlacemark = function(placemark) {

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

  var point = this.getElementByTagName(placemark, 'Point');
  if (!point) {
    return;
  }
  var coordinates = this.getElementByTagName(point, 'coordinates');
  if (!coordinates) {
    return;
  }
  var shapeId = trip.textContent.replace(" ","");
  console.log("shape id is "+shapeId);

  var points = this.parseCoordinates(coordinates.textContent);
  if(this._outputElement.value.indexOf(shapeId) == -1){
      this.writePoints(shapeId, points);
  }
  if (this._generateReverseShapes) {
    this.writePoints(shapeId + '-reverse', points.reverse());
  }
};


KmlToGtfsShapesTrip.prototype.getElementByTagName = function(element, name) {
  for (var i = 0; i < element.childNodes.length; ++i) {
    if (element.childNodes[i].nodeName == name) {
      return element.childNodes[i];
    }
  }
  return null;
};

KmlToGtfsShapesTrip.prototype.parseCoordinates = function(text) {
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

KmlToGtfsShapesTrip.prototype.writeHeader = function() {
  this._outputElement.value =
    'route_id,service_id,trip_id,trip_headsign,direction_id,block_id,shape_id\n';
};

KmlToGtfsShapesTrip.prototype.writePoints = function(shapeId, points) {
  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    var line = (i+1) + ',' +(i+1) +shapeId.charAt(0)+'_'+ 
    shapeId.charAt(shapeId.length - 3)+shapeId.charAt(shapeId.length - 2)+
    shapeId.charAt(shapeId.length - 1) + ',' + shapeId.charAt(0)+
    shapeId.charAt(shapeId.length - 3)+shapeId.charAt(shapeId.length - 2)+
    shapeId.charAt(shapeId.length - 1)+',' + shapeId +',' + '1' + ',' + ',' + shapeId + '\n';
    this._outputElement.value += line;
    return;
  }
}

function kml_to_gtfs_shapes_init_trips() {
  var converter = new KmlToGtfsShapesTrip(document.getElementById('output'));

  document.getElementById('file').addEventListener(
    'change', function(event) {
      var ready = converter.handleFileSelect(event.target.files);
      document.getElementById('convert-button-trips').disabled = !ready;
    });

  document.getElementById('generate-reverse-shapes').addEventListener(
    'change', function(event) {
      converter.setGenerateReverseShapes(event.target.checked);
    });

  document.getElementById('convert-button-trips').addEventListener(
    'click', function(event) {
      converter.convert();
    });

}


