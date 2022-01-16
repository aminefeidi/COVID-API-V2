const getJhu = require('../parsers/jhu.parser');
const getWm = require('../parsers/woldometers.parser');
const storage = require('node-persist')
const mongoose = require("mongoose");
const SubSchema = require("../models/subscription");
const notifier = require("./../utils/notifier");

let Subscriptions;

async function loadSources(){
    const store = {
        global:null,
        countries:[],
        countriesWithHistory:[],
        countryList:[],
        geoJson:null,
        lastUpdated:null
    }
    console.log("initializing storage...");
    await storage.init();
    console.log("Fetching historical data from JHU...");
    await getJhu(store);
    console.log("Parsing today cases from WorldoMeters...");
    await getWm(store);
    store.countriesWithHistory.forEach(c=>{
        store.countryList.push({
            id:c.id+1,
            name:c.name
        })
        store.countries.push({
            id:c.id,
            name:c.name,
            today: c.today
        })
    })
    store.lastUpdated = new Date();
    await storage.setItem('countries_history',store.countriesWithHistory);
    await storage.setItem('countries',store.countries);
    await storage.setItem('countryList',store.countryList);
    await storage.setItem('global',store.global);
    await storage.setItem('geojson',store.geoJson);
    await storage.setItem('lastUpdated',store.lastUpdated);
}

function initDB(DB_STRING){
    return new Promise((resolve,reject)=>{
        mongoose.connect(
            DB_STRING,
            { useNewUrlParser: true, useUnifiedTopology: true }
        ).catch(err=>reject(err));
        
        const db = mongoose.connection;
        
        db.on("error", err=>reject(err));
        db.once("open", function() {
            console.log("connected to DB");
            const subscriptionSchema = SubSchema;
            Subscriptions = mongoose.model("Subscriptions", subscriptionSchema);
            notifier.init(Subscriptions);
            resolve(Subscriptions);
        });
    })
}

const loader = {};
loader.loadSources = loadSources;
loader.initDB = initDB;

module.exports = loader;