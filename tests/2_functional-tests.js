const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('GET /api/stock-prices => stockData object', () => {
    test('Viewing one stock: GET request to /api/stock-prices/', (done) => {
      chai.request(server).get('/api/stock-prices')
        .query({ stock: 'goog' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body['stockData']['stock'], 'goog');
          assert.isNotNull(res.body['stockData']['price']);
          assert.isNotNull(res.body['stockData']['likes']);
          done();
        });
    });

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', (done) => {
      chai.request(server).get('/api/stock-prices')
        .query({ stock: 'aapl', like: true })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body['stockData']['stock'], 'aapl');
          assert.equal(res.body['stockData']['likes'], 1);
          done();
        });
    });

    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', (done) => {
      chai.request(server).get('/api/stock-prices')
        .query({ stock: 'aapl', like: true })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body, 'Error: Only 1 Like per IP allowed');
          done();
        });
    });

    test('Viewing two stocks: GET request to /api/stock-prices/', (done) => {
      chai.request(server).get('/api/stock-prices')
        .query({ stock: ['fb', 'tsla']})
        .end((err, res) => {
          let stockData = res.body['stockData'];
          assert.isArray(stockData);

          if (stockData[0]['stock'] === 'fb') {
            assert.equal(res.status, 200);
            assert.equal(stockData[0]['stock'], 'fb');
            assert.equal(stockData[0]['likes'], 0);
            assert.equal(stockData[0]['rel_likes'], 0);
            assert.equal(stockData[1]['stock'], 'tsla');
            assert.equal(stockData[1]['likes'], 0);
            assert.equal(stockData[1]['rel_likes'], 0);
          } else {
            assert.equal(res.status, 200);
            assert.equal(stockData[0]['stock'], 'fb');
            assert.equal(stockData[0]['likes'], 0);
            assert.equal(stockData[0]['rel_likes'], 0);
            assert.equal(stockData[1]['stock'], 'tsla');
            assert.equal(stockData[1]['likes'], 0);
            assert.equal(stockData[1]['rel_likes'], 0);
          }
          done();
        });
    });

    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', (done) => {
      chai.request(server).get('/api/stock-prices')
        .query({stock: ['spot', 'baba'], like: true})
        .end((err, res) => {
          let stockData = res.body.stockData;
          if (stockData[0]['stock'] === 'spot') {
            assert.equal(res.status, 200);
            assert.equal(stockData[0]['stock'], 'spot');
            assert.equal(stockData[0]['likes'], 1);
            assert.equal(stockData[0]['rel_likes'], 0);
            assert.equal(stockData[1]['stock'], 'baba');
            assert.equal(stockData[1]['likes'], 1);
            assert.equal(stockData[1]['rel_likes'], 0);
          } else {
            assert.equal(res.status, 200);
            assert.equal(stockData[1]['stock'], 'spot');
            assert.equal(stockData[1]['likes'], 1);
            assert.equal(stockData[1]['rel_likes'], 0);
            assert.equal(stockData[0]['stock'], 'baba');
            assert.equal(stockData[0]['likes'], 1);
            assert.equal(stockData[0]['rel_likes'], 0);
          }
          done();
        });
    });
  });
});
