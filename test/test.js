require('dotenv').config()
const { PORT } = process.env;
const assert = require('assert');
const request = require('supertest');
const addon = require('../server');

var server = null;

describe('Addon', () => {
    it('should be running', (done) => {
        addon.run((err, res) => {
            assert(err == null, 'there is an error');
            assert(res.server !== undefined, 'is undefined');
            server = res.server;
            done();
        });
    });
});

describe('Home page', () => {
    
});

describe('Manifest', () => {
    it('should be a valid object', (done) => {
        request(server)
            .get('/manifest.json')
            .expect(200)
            .end((err, res) => {
                assert(err == null, 'there is an error');
                assert(res.status === 200, 'status error');
                assert(typeof (res.body) === 'object', 'not an object');
                done();
            });
    });
});

describe('Catalog', () => {
    describe('with no extra params', () => {
        it('should return a valid object array', (done) => {
            request(server)
                .get('/catalog/movie/vimeo.json')
                .expect(200)
                .end((err, res) => {
                    assert(err == null, 'there is an error');
                    assert(res.status === 200, 'status error');
                    assert(res.body.metas != undefined, 'is undefined');
                    assert(res.body.metas.length > 0, 'is empty');
                    assert(typeof (res.body.metas) === 'object', 'not an object');
                    done();
                });
        });
    });

    describe('with extra params: genre', () => {
        it('should return a valid object array', (done) => {
            request(server)
                .get('/catalog/movie/vimeo/genre=Arts & Design.json')
                .expect(200)
                .end((err, res) => {
                    assert(err == null, 'there is an error');
                    assert(res.status === 200, 'status error');
                    assert(res.body.metas != undefined, 'is undefined');
                    assert(typeof (res.body.metas) === 'object', 'not an object');
                    assert(res.body.metas.length > 0, 'is empty');
                    done();
                });
        });
    });

    describe('with extra params: skip', () => {
        it('should return a valid object array', (done) => {
            request(server)
                .get('/catalog/movie/vimeo/skip=60.json')
                .expect(200)
                .end((err, res) => {
                    assert(err == null, 'there is an error');
                    assert(res.status === 200, 'status error');
                    assert(typeof (res.body.metas) === 'object', 'not an object');
                    assert(res.body.metas != undefined, 'is undefined');
                    assert(res.body.metas.length > 0, 'is empty');
                    done();
                });
        });
    });
});

describe('Meta', () => {
    it('should return a valid object array', (done) => {
        request(server)
            .get('/meta/movie/vimeo_id:137448934.json')
            .expect(200)
            .end((err, res) => {
                assert(err == null, 'there is an error');
                assert(res.status === 200, 'status error');
                assert(res.body.meta != undefined, 'is undefined');
                assert(typeof (res.body.meta) === 'object', 'not an object');
                assert(res.body.meta.length > 0, 'is empty');
                done();
            });
    });
});

describe('Stream', () => {
    it('should return a valid object array', (done) => {
        request(server)
            .get('/stream/movie/vimeo_id:137448934.json')
            .expect(200)
            .end((err, res) => {
                assert(err == null, 'there is an error');
                assert(res.status === 200, 'status error');
                assert(res.body.streams != undefined, 'is undefined');
                assert(typeof (res.body.streams) === 'object', 'not an object');
                assert(res.body.streams.length > 0, 'is empty');
                done();
            });
    });
});

describe('Addon', () => {
    it('should be closing', (done) => {
        assert(server.close(), 'cannot close');
        done();
    });
});