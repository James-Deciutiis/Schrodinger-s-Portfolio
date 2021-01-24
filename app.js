const { IEXCloudClient } = require("node-iex-cloud")
const fetch = require("node-fetch")
const express = require('express')
const app = express()

var balance = 0
var starting_balance = 0
var start = null
var end = null
var start_string = null
var end_string = null
var portfolio_array = []
var data_array = []
var end_data_array = []
var result_array = []
var count = 0;

const iex = new IEXCloudClient(fetch, {
      sandbox: false,
      publishable: "pk_afeb706cc2704012b3bd7f693320751b",
      version: "stable"
});

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:false}))

app.get('/', function (req, res) {
    res.render('index', { data : null });
});

app.post('/start', function (req, res){
    res.render('input', {})
});

app.post('/portfolio', function(req, res){
    if(Number.isNaN(req.body.balance[0]) || !(req.body.balance[0] > 0)){
	    throw("balace invalid")
    }
    
    portfolio_array = []
    data_array = []
    result_array = []
    end_data_array = []

    start_string = req.body.start_date
    end_string = req.body.end_date
    start = req.body.start_date.replace(/-/g, '')
    end = req.body.end_date.replace(/-/g, '')
    balance = req.body.balance
    starting_balance = req.body.balance

    if(start >= end){
        throw("End date is either before or the same date as start date")
    }

    res.render('portfolio', { quote: null, balance : balance, start_date : req.body.start_date, end_date : req.body.end_date, portfolio: portfolio_array })
});

app.post('/add', function(req, res){
    let val = 0
    try{
        iex.symbol(req.body.stock_name).chart("date", { date: start , chartByDay: true }).then(function(obj){
        val = obj[0].close * req.body.shares 
	    if(balance-val < 0){
		    throw("cant afford stock")
	    }

		else{
            balance -= val;
            portfolio_array.push(["Stock Symbol: " + req.body.stock_name + " ", " Close on date: " + obj[0].close + " ", " Shares: " + req.body.shares + " ", " Total value: " + val + " "])
            data_array.push([req.body.stock_name, obj[0].close, req.body.shares])
            try{
                iex.symbol(req.body.stock_name).chart("date", { date: end , chartByDay: true }).then(function(tmp){
                end_data_array.push([req.body.stock_name, tmp[0].close, req.body.shares])
         

                res.render('portfolio', { quote: null, balance : balance , start_date : start_string, end_date : end_string, portfolio : portfolio_array});
                });
            } 
            catch(error){
            }
	    }
        
        });
    }
    catch(error){
        console.log('caught')
    }
});

app.post('/quote', function(req, res){
    try{
        iex.symbol(req.body.stock_quote).chart("date", { date: start , chartByDay: true }).then(function(obj){
        let tmp = obj[0].close

        res.render('portfolio', { quote: tmp, balance : balance , start_date : start_string, end_date : end_string, portfolio : portfolio_array});
        
        });
    }
    catch(error){
        console.log('caught')
    }
});

app.post('/result', function(req, res){
    var retval = 0
    var final_value = 0
    try{
        for(var i = 0; i < data_array.length; i++){
            var sym = data_array[i][0]
            var close = data_array[i][1]
            var shares = data_array[i][2]
            retval = ((end_data_array[i][1]-close)/close)*100
            var equity = shares*end_data_array[i][1]
            final_value+=equity
            result_array.push(["Symbol: " + sym + " ", " Bought at: " + close + " "," Close at: " + end_data_array[i][1] + " ", " Amount of shares bought: " + shares + " ", " Gain/Loss(%): " + retval + " " + "Equity($): " + equity + " " ])
            
        }
        
        var final_percentage = ((final_value-starting_balance)/(starting_balance)) * 100
        res.render('result', {portfolio: result_array, final_value: final_value+balance, start_value: starting_balance, percent : final_percentage})
    }
    catch(error){
        console.log(error)
    }

});

app.listen(process.env.PORT || 3000, function(){
	  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
