require('dotenv').config()
const { PORT } = process.env;
const assert = require('assert');
const request = require('supertest');
const app = require('../index');

describe('Manifest', () => {
    it('should be a valid object', (done) => {
        request(app)
        .get('/manifest.json')
        .expect(200)
        .end((err, res) => {
            assert(typeof (res.body) === 'object', 'not an object');
            done();
        });
    });
});

describe('Catalog', () => {
    describe('with no extra params', () => {
        it('should return a valid object array', (done) => {
            request(app)
            .get('/catalog/movie/vimeo.json')
            .expect(200)
            .end((err, res) => {
                assert(typeof (res.body.metas) === 'object', 'not an object');
                assert(typeof (res.body.metas) !== undefined, 'is undefined');
                done();
            });
        });
    });

    describe('with extra params: genre', () => {
        it('should return a valid object array', (done) => {
            request(app)
            .get('/catalog/movie/vimeo/genre=Arts & Design.json')
            .expect(200)
            .end((err, res) => {
                assert(typeof (res.body.metas) === 'object', 'not an object');
                assert(typeof (res.body.metas) !== undefined, 'is undefined');
                done();
            });
        });
    });

    describe('with extra params: skip', () => {
        it('should return a valid object array', (done) => {
            request(app)
            .get('/catalog/movie/vimeo/skip=60.json')
            .expect(200)
            .end((err, res) => {
                assert(typeof (res.body.metas) === 'object', 'not an object');
                assert(typeof (res.body.metas) !== undefined, 'is undefined');
                done();
            });
        });
    });
});

describe('Meta', () => {
    it('should return a valid object array', (done) => {
        request(app)
        .get('/meta/movie/vimeo_id:137448934.json')
        .expect(200)
        .end((err, res) => {
            assert(typeof (res.body.meta) === 'object', 'not an object');
            assert(typeof (res.body.meta) !== undefined, 'is undefined');
            done();
        });
    });
});

describe('Stream', () => {
    it('should return a valid object array', (done) => {
        request(app)
        .get('/stream/movie/vimeo_id:137448934.json')
        .expect(200)
        .end((err, res) => {
            assert(typeof (res.body.streams) === 'object', 'not an object');
            assert(typeof (res.body.streams) !== undefined, 'is undefined');
            done();
        });
    });
});

app.close();