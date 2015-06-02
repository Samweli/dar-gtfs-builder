function KmlToGtfsShapesStop(outputElement) {
  this._outputElement = outputElement;
  this._file = null;
  this._generateReverseShapes = false;
}

KmlToGtfsShapesStop.prototype.setGenerateReverseShapes = function(enabled) {
  this._generateReverseShapes = enabled;
}

KmlToGtfsShapesStop.prototype.handleFileSelect = function(files) {
  if (files.length != 1) {
    console.log('Expected just one file.');
    return false;
  }
  this._file = files[0];
  return true;
}

KmlToGtfsShapesStop.prototype.convert = function() {
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

KmlToGtfsShapesStop.prototype.handleFileRead = function(text) {
  var parser = new DOMParser();
  var xml = parser.parseFromString(text,"text/xml");
  var placemarks = xml.getElementsByTagName('Placemark');
  for (var i = 0; i < placemarks.length; ++i) {
    this.processPlacemark(placemarks[i]);
  }
};

KmlToGtfsShapesStop.prototype.processPlacemark = function(placemark) {
  var name = this.getElementByTagName(placemark, 'name');

  if (!name) {
    console.log("no name");
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
  this.writePoints(shapeId, points);
  if (this._generateReverseShapes) {
    this.writePoints(shapeId + '-reverse', points.reverse());
  }
};

KmlToGtfsShapesStop.prototype.getElementByTagName = function(element, name) {
  for (var i = 0; i < element.childNodes.length; ++i) {
    if (element.childNodes[i].nodeName == name) {
      return element.childNodes[i];
    }
  }
  return null;
};

KmlToGtfsShapesStop.prototype.parseCoordinates = function(text) {
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

KmlToGtfsShapesStop.prototype.writeHeader = function() {
  this._outputElement.value =
    'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,timepoint\n';
};

KmlToGtfsShapesStop.prototype.writePoints = function(shapeId, points) {
  console.log("writing points");
  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    var line = (i+1) + ','+ (i+1) +  ','+ shapeId + ',' +',' + point.lat + ',' + point.lng + ',' + ','+ ',' + 0 + '\n';
    this._outputElement.value += line;
    
  }
}

function kml_to_gtfs_shapes_init_stops() {
  var converter = new KmlToGtfsShapesStop(document.getElementById('output'));

  document.getElementById('file').addEventListener(
    'change', function(event) {
      var ready = converter.handleFileSelect(event.target.files);
      document.getElementById('convert-button-stops').disabled = !ready;
    });

  document.getElementById('generate-reverse-shapes').addEventListener(
    'change', function(event) {
      converter.setGenerateReverseShapes(event.target.checked);
    });

  document.getElementById('convert-button-stops').addEventListener(
    'click', function(event) {
      converter.convert();
    });

}
