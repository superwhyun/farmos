var should = require('should');
var request = require('supertest');
var server = require('../../../app');

describe('controllers', function() {

  describe('farmos', function() {

    describe('GET /farmos/v1/field', function() {

      it('should return a default string', function(done) {

        request(server)
          .get('/farmos/v1/field')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.eql('');

            done();
          });
      });
    });

    describe('GET /farmos/v1/field/1/lastobservation', function() {
      it('should accept a field parameter', function(done) {

        request(server)
          .get('/farmos/v1/field/1/lastobservation')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.eql('');

            done();
          });
      });

    });

  });

});
