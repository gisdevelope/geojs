// Test geo.transform

describe('geo.transform', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var closeToEqual = require('../test-utils').closeToEqual;
  var closeToArray = require('../test-utils').closeToArray;

  function r2(pt1, pt2) {
    // euclidean norm
    var dx = pt1.x - pt2.x,
        dy = pt1.y - pt2.y,
        dz = (pt1.z || 0) - (pt2.z || 0);

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  it('default initialization', function () {
    var proj = geo.transform();

    expect(proj.source()).toBe('EPSG:4326');
    expect(proj.target()).toBe('EPSG:3857');
  });

  // return a compact string representation of a point
  function str(pt) {
    return JSON.stringify(pt);
  }

  // define a projection independent transform test
  function test_transform(src, src_unit, tgt, tgt_unit, pts) {
    describe(src + ' -> ' + tgt, function () {
      var proj = geo.transform({source: src, target: tgt});

      function test_point(pt) {
        var pt1 = $.extend({}, pt[0]), pt2 = $.extend({}, pt[1]);
        it(str(pt[0]) + ' -> ' + str(pt[1]), function () {
          expect(r2(proj.forward(pt1), pt[1])).toBeLessThan(tgt_unit);
        });
        it(str(pt[0]) + ' <- ' + str(pt[1]), function () {
          expect(r2(pt[0], proj.inverse(pt2))).toBeLessThan(src_unit);
        });
      }

      pts.forEach(test_point);
      it('Array of points ( forward )', function () {
        var a = pts.map(function (d) { return $.extend({}, d[0]); }),
            c = proj.forward(a);
        pts.forEach(function (d, i) {
          expect(r2(d[1], c[i])).toBeLessThan(tgt_unit);
        });
      });
      it('Array of points ( inverse )', function () {
        var a = pts.map(function (d) { return $.extend({}, d[1]); }),
            c = proj.inverse(a);
        pts.forEach(function (d, i) {
          expect(r2(d[0], c[i])).toBeLessThan(src_unit);
        });
      });
    });
  }

  test_transform(
    'EPSG:4326', 1e-4, 'EPSG:3857', 10,
    [
      [{x: 0, y: 0}, {x: 0, y: 0}],
      [{x: 90, y: 45}, {x: 10018754, y: 5621521}],
      [{x: -90, y: -45}, {x: -10018754, y: -5621521}],
      [{x: -15, y: 85}, {x: -1669792, y: 19971868}],
      [{x: 15, y: -85}, {x: 1669792, y: -19971868}]
    ]
  );

  test_transform(
    'EPSG:4326', 1e-6, 'EPSG:4326', 1e-6,
    [
      [{x: 0, y: 0}, {x: 0, y: 0}],
      [{x: 90, y: 45}, {x: 90, y: 45}],
      [{x: -90, y: -45}, {x: -90, y: -45}],
      [{x: -15, y: 85}, {x: -15, y: 85}],
      [{x: 15, y: -85}, {x: 15, y: -85}]
    ]
  );

  test_transform(
    'EPSG:3857', 1, 'EPSG:3857', 1,
    [
      [{x: 0, y: 0}, {x: 0, y: 0}],
      [{x: 10018754, y: 5621521}, {x: 10018754, y: 5621521}],
      [{x: -10018754, y: -5621521}, {x: -10018754, y: -5621521}],
      [{x: -1669792, y: 19971868}, {x: -1669792, y: 19971868}],
      [{x: 1669792, y: -19971868}, {x: 1669792, y: -19971868}]
    ]
  );

  describe('defs', function () {
    var server;

    beforeEach(function () {
      server = sinon.fakeServer.create();
    });

    afterEach(function () {
      server.restore();
    });

    it('predefined definitions', function () {
      expect(geo.transform.defs.hasOwnProperty('EPSG:4326')).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('EPSG:3857')).toBe(true);
    });

    it('custom definition', function () {
      geo.transform.defs('my projection', '+proj=longlat +datum=WGS84 +no_defs');
      expect(geo.transform.defs.hasOwnProperty('my projection')).toBe(true);
      var p = geo.transform({source: 'EPSG:4326', target: 'my projection'});

      expect(p.forward({x: 10, y: -10, z: 0})).toEqual({x: 10, y: -10, z: 0});
    });

    it('lookup', function () {
      var spy = sinon.spy(), request;
      geo.transform.lookup('EPSG:5000').then(spy);

      request = server.requests[0];
      expect(request.url).toMatch(/\?q=5000/);
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({
        status: 'ok',
        number_result: 1,
        results: [{
          code: '5000',
          kind: 'CRS-PROJCRS',
          bbox: [
            85.06,
            180.0,
            85.06,
            180.0
          ],
          unit: 'degree',
          proj4: '+proj=longlat +datum=WGS84 +no_defs',
          name: 'WGS 84',
          area: 'World',
          default_trans: 0,
          trans: [],
          accuracy: ''
        }]
      }));

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('EPSG:5000')).toBe(true);

      geo.transform.lookup('EPSG:5000');
      expect(server.requests.length).toBe(1);
    });

    it('invalid projection code', function () {
      var spy = sinon.spy(), request;
      geo.transform.lookup('EPSG:5001').fail(spy);

      request = server.requests[0];
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({
        status: 'ok',
        number_result: 0,
        results: []
      }));

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('EPSG:5001')).toBe(false);
    });

    it('unknown projection type', function () {
      var spy = sinon.spy();
      geo.transform.lookup('unknown:5002').fail(spy);

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('unknown:5002')).toBe(false);
    });
  });

  describe('transform cache', function () {
    it('cache is used', function () {
      var trans = geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'});
      expect(geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'})).toBe(trans);
    });
    it('cache is cleared for targets', function () {
      var trans = geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'});
      for (var i = 0; i < 10; i += 1) {
        var target = '+proj=eqc +ellps=GRS80 +lat_0=0 +lat_ts=' + i + ' +lon_0=0 +no_defs +towgs84=0,0,0,0,0,0,0 +units=m +x_0=0 +y_0=0';
        geo.transform({source: 'EPSG:4326', target: target});
      }
      expect(geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'})).not.toBe(trans);
    });
    it('cache is cleared for sources', function () {
      var trans = geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'});
      for (var i = 0; i < 10; i += 1) {
        var source = '+proj=eqc +ellps=GRS80 +lat_0=0 +lat_ts=' + i + ' +lon_0=0 +no_defs +towgs84=0,0,0,0,0,0,0 +units=m +x_0=0 +y_0=0';
        geo.transform({source: source, target: 'EPSG:3857'});
      }
      expect(geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'})).not.toBe(trans);
    });
  });

  describe('transformCoordinates', function () {
    var source = '+proj=longlat +axis=esu',
        target = '+proj=longlat +axis=enu';
    it('identity', function () {
      var coor = {x: 1, y: 2, z: 3};
      expect(geo.transform.transformCoordinates(
        'EPSG:4326', 'EPSG:4326', coor)).toBe(coor);
    });
    it('bad parameters', function () {
      expect(function () {
        geo.transform.transformCoordinates(source, target, undefined);
      }).toThrow(new Error('Coordinates are not valid'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [[1], [2], [3]]);
      }).toThrow(new Error('Invalid coordinates. Requires two or three components per array'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5], 5);
      }).toThrow(new Error('Number of components should be two or three'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5]);
      }).toThrow(new Error('Invalid coordinates'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [{z: 5}]);
      }).toThrow(new Error('Invalid coordinates'));
    });
    it('coordinate format - single object', function () {
      expect(closeToEqual(geo.transform.transformCoordinates(source, target, {x: 1, y: 2}), {x: 1, y: -2})).toBe(true);
      expect(closeToEqual(geo.transform.transformCoordinates(source, target, {x: 3, y: 4, z: 5}), {x: 3, y: -4, z: 5})).toBe(true);
    });
    it('coordinate format - array with single object', function () {
      var res;
      res = geo.transform.transformCoordinates(source, target, [{x: 1, y: 2}]);
      expect(res instanceof Array).toBe(true);
      expect(res.length).toBe(1);
      expect(closeToEqual(res[0], {x: 1, y: -2})).toBe(true);
      res = geo.transform.transformCoordinates(source, target, [{x: 3, y: 4, z: 5}]);
      expect(res instanceof Array).toBe(true);
      expect(res.length).toBe(1);
      expect(closeToEqual(res[0], {x: 3, y: -4, z: 5})).toBe(true);
    });
    it('coordinate format - single array', function () {
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [1, 2]), [1, -2])).toBe(true);
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [3, 4, 5]), [3, -4, 5])).toBe(true);
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5, 6], 2), [1, -2, 3, -4, 5, -6])).toBe(true);
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5, 6], 3), [1, -2, 3, 4, -5, 6])).toBe(true);
    });
    it('coordinate format - array of arrays', function () {
      var res;
      res = geo.transform.transformCoordinates(source, target, [[1, 2], [3, 4], [5, 6]]);
      expect(res.length).toBe(3);
      expect(closeToArray(res[0], [1, -2])).toBe(true);
      expect(closeToArray(res[1], [3, -4])).toBe(true);
      expect(closeToArray(res[2], [5, -6])).toBe(true);
      res = geo.transform.transformCoordinates(source, target, [[1, 2, 3], [4, 5, 6]]);
      expect(res.length).toBe(2);
      expect(closeToArray(res[0], [1, -2, 3])).toBe(true);
      expect(closeToArray(res[1], [4, -5, 6])).toBe(true);
    });
    it('coordinate format - array of objects', function () {
      var res;
      res = geo.transform.transformCoordinates(source, target, [{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}]);
      expect(res.length).toBe(3);
      expect(closeToEqual(res[0], {x: 1, y: -2})).toBe(true);
      expect(closeToEqual(res[1], {x: 3, y: -4})).toBe(true);
      expect(closeToEqual(res[2], {x: 5, y: -6})).toBe(true);
      res = geo.transform.transformCoordinates(source, target, [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}]);
      expect(res.length).toBe(2);
      expect(closeToEqual(res[0], {x: 1, y: -2, z: 3})).toBe(true);
      expect(closeToEqual(res[1], {x: 4, y: -5, z: 6})).toBe(true);
    });
  });

  describe('affine functions', function () {
    it('affineForward', function () {
      var coor, res;
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineForward({origin: {x: 0, y: 0}}, coor);
      expect(coor).toEqual(res);
      expect(res.length).toBe(2);
      expect(res[0]).toEqual({x: 1, y: 2, z: 3});
      expect(res[1]).toEqual({x: 4, y: 5, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineForward({origin: {x: -2, y: -3}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: 3, y: 5, z: 3});
      expect(res[1]).toEqual({x: 6, y: 8, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineForward({origin: {x: -2, y: -3}, scale: {x: 2, y: 3, z: 4}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: 6, y: 15, z: 12});
      expect(res[1]).toEqual({x: 12, y: 24, z: 24});
    });
    it('affineInverse', function () {
      var coor, res;
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineInverse({origin: {x: 0, y: 0}}, coor);
      expect(coor).toEqual(res);
      expect(res.length).toBe(2);
      expect(res[0]).toEqual({x: 1, y: 2, z: 3});
      expect(res[1]).toEqual({x: 4, y: 5, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineInverse({origin: {x: -2, y: -3}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: -1, y: -1, z: 3});
      expect(res[1]).toEqual({x: 2, y: 2, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineInverse({origin: {x: -2, y: -3}, scale: {x: 2, y: 3, z: 4}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: -3 / 2, y: -7 / 3, z: 3 / 4});
      expect(res[1]).toEqual({x: 0, y: -4 / 3, z: 6 / 4});
    });
  });
});