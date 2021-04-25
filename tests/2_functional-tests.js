const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('GET /api/stock-prices => stockData object', () => {
    test('1 stock', (done) => {
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

    
  });
});
