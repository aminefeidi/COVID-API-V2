const getJhu = require('../parsers/jhu.parser');
const getWm = require('../parsers/woldometers.parser');
const storage = require('node-persist')

async function loadSources(){
    const store = {
        global:null,
        countries:[],
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
    store.countries.forEach(c=>{
        store.countryList.push({
            id:c.id+1,
            name:c.name
        })
    })
    store.lastUpdated = new Date();
    await storage.setItem('countries',store.countries);
    await storage.setItem('countryList',store.countryList);
    await storage.setItem('global',store.global);
    await storage.setItem('geojson',store.geoJson);
    await storage.setItem('lastUpdated',store.lastUpdated);
}

const loader = {};
loader.loadSources = loadSources;

module.exports = loader;