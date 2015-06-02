
function KmlToGtfsShapesRoute(outputElement) {
  this._outputElement = outputElement;
  this._file = null;
  this._generateReverseShapes = false;
}

KmlToGtfsShapesRoute.prototype.setGenerateReverseShapes = function(enabled) {
  this._generateReverseShapes = enabled;
}

KmlToGtfsShapesRoute.prototype.handleFileSelect = function(files) {
  if (files.length != 1) {
    console.log('Expected just one file.');
    return false;
  }
  this._file = files[0];
  return true;
}

KmlToGtfsShapesRoute.prototype.convert = function() {
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

KmlToGtfsShapesRoute.prototype.handleFileRead = function(text) {
  var parser = new DOMParser();
  var xml = parser.parseFromString(text,"text/xml");
  var placemarks = xml.getElementsByTagName('Placemark');
  for (var i = 0; i < placemarks.length; ++i) {
    this.processPlacemark(placemarks[i]);
    return;
  }
};

KmlToGtfsShapesRoute.prototype.processPlacemark = function(placemark) {
 

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
   var route = sData[2];

  var point = this.getElementByTagName(placemark, 'Point');
  if (!point) {
    return;
  }
  var coordinates = this.getElementByTagName(point, 'coordinates');
  if (!coordinates) {
    return;
  }
  var shapeId = route.textContent;
  var points = this.parseCoordinates(coordinates.textContent);
  this.writePoints(shapeId, points);

  if (this._generateReverseShapes) {
    this.writePoints(shapeId + '-reverse', points.reverse());
  }
};

KmlToGtfsShapesRoute.prototype.getElementByTagName = function(element, name) {
  for (var i = 0; i < element.childNodes.length; ++i) {
    if (element.childNodes[i].nodeName == name) {
      return element.childNodes[i];
    }
  }
  return null;
};

KmlToGtfsShapesRoute.prototype.parseCoordinates = function(text) {
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

KmlToGtfsShapesRoute.prototype.writeHeader = function() {
  this._outputElement.value =
    'route_id,agency_id,route_short_name,route_long_name,route_desc,'+
     'route_type,route_url,route_color,route_text_color\n';
};

KmlToGtfsShapesRoute.prototype.writePoints = function(shapeId, points) {
  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    var line =  '1,daladala,1,' + shapeId + ',,3,,,'+ '\n';
    this._outputElement.value += line;
  }
}

function kml_to_gtfs_shapes_init_routes() {
  var converter = new KmlToGtfsShapesRoute(document.getElementById('output'));

  document.getElementById('file').addEventListener(
    'change', function(event) {
      var ready = converter.handleFileSelect(event.target.files);
      document.getElementById('convert-button-routes').disabled = !ready;
    });

  document.getElementById('generate-reverse-shapes').addEventListener(
    'change', function(event) {
      converter.setGenerateReverseShapes(event.target.checked);
    });

  document.getElementById('convert-button-routes').addEventListener(
    'click', function(event) {
      converter.convert();
    });

}
