'use strict';

const expect = require('chai').expect;
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;


module.exports = function (app) {

  let uri = process.env.DB;
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

  let stockSchema = new mongoose.Schema({
    name: {type: String, required: true},
    likes: {type: Number, default: 0},
    ips: [String]
  });

  let Stock = mongoose.model('Stock', stockSchema);

  app.route('/api/stock-prices')
    .get(function (req, res){
      let responseObject = {};
      responseObject['stockData'] = {};

      let twoStocks = false;

      let outputResponse = () => {
        return res.json(responseObject);
      };

      let findOrUpdateStock = (stockName, documentUpdate, nextStep) => {
        Stock.findOneAndUpdate(
          {name: stockName},
          documentUpdate,
          {new: true, upsert: true},
          (err, stockDocument) => {
            if(err) {
              console.log(err);
            } else if(!err && stockDocument) {
              if(twoStocks === false) {
                return nextStep(stockDocument, processOneStock);
              } else {
                return nextStep(stockDocument, processTwoStock);
              }
            }
          });
      };

      let likeStock = (stockName, nextStep) => {
        Stock.findOne({ name: stockName }, (err, stockDocument) => {
          if (!err && stockDocument && stockDocument['ips'] && stockDocument['ips'].includes(req.ip)) {
            return res.json('Error: Only 1 Like per IP allowed');
          } else {
            let documentUpdate = {$inc: {likes: 1}, $push: {ips: req.ip}};
            nextStep(stockName, documentUpdate, getPrice);
          }
        });
      };

      let getPrice = (stockDocument, nextStep) => {
        let xhr = new XMLHttpRequest();
        let requestUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stockDocument['name'] + '/quote';
        xhr.open('GET', requestUrl, true);
        xhr.onload = () => {
          let apiResponse = JSON.parse(xhr.responseText);
          stockDocument['price'] = parseFloat(apiResponse['latestPrice'].toFixed(2));
          nextStep(stockDocument, outputResponse);
        };
        xhr.send();
      };

      let processOneStock = (stockDocument, nextStep) => {
        responseObject['stockData']['stock'] = stockDocument['name'];
        responseObject['stockData']['price'] = stockDocument['price'];
        responseObject['stockData']['likes'] = stockDocument['likes'];
        nextStep();
      };

      let stocks = [];
      let processTwoStock = (stockDocument, nextStep) => {
        let newStock = {};
        newStock['stock'] = stockDocument['name'];
        newStock['price'] = stockDocument['price'];
        newStock['likes'] = stockDocument['likes'];

        stocks.push(newStock);

        if (stocks.length === 2) {
          stocks[0]['rel_likes'] = stocks[0]['likes'] - stocks[1]['likes'];
          stocks[1]['rel_likes'] = stocks[1]['likes'] - stocks[0]['likes'];
          responseObject['stockData'] = stocks;
          nextStep()
        } else {
          return;
        }
      };

      if (typeof (req.query.stock) === 'string') {
        let stockName = req.query.stock;

        let documentUpdate = {};
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }

      } else if (Array.isArray(req.query.stock)) {
        twoStocks = true;

        let stockName = req.query.stock[0];
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          let documentUpdate = {};
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }

        stockName = req.query.stock[1];
        if (req.query.like && req.query.like === 'true') {
          likeStock(stockName, findOrUpdateStock);
        } else {
          let documentUpdate = {};
          findOrUpdateStock(stockName, documentUpdate, getPrice);
        }
      }
      
    });
    
};
