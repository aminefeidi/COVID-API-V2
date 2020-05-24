const config = require("config");
const Path = require("path");
const Fs = require("fs");
const Axios = require("axios");
const csv = require('neat-csv');
const isDate = require('../utils/date_utils');
const {matchName} = require("../utils/name_utils")

module.exports = async (store) => {
    //download files
    const url = config.get("jhuBaseUrl");
    const prod = config.get("prod");
    if(prod){
        try {
            await downloadFile(url + "confirmed_global.csv", "confirmed.csv");
            await downloadFile(url + "recovered_global.csv", "recovered.csv");
            await downloadFile(url + "deaths_global.csv", "deaths.csv");
        } catch (error) {
            console.log("error downloading files");
            throw error;
        }
    }
    //parse them
    let rawData = {};
    try {
        rawData.toll = await csv(
            Fs.createReadStream("./parsers/files/confirmed.csv")
        );
        rawData.recovered = await csv(
            Fs.createReadStream("./parsers/files/recovered.csv")
        );
        rawData.deaths = await csv(
            Fs.createReadStream("./parsers/files/deaths.csv")
        );
    } catch (error) {
        console.log("error parsing csv");
        throw error;
    }
    let dates = []
    Object.keys(rawData.toll[0]).map((key)=>{
        if(isDate(key)) dates.push(key);
    })
    
    makeHistory(store,rawData,dates);
    makeGlobalHistory(store,dates);
    estimateToday(store,dates);
    toGeoJson(rawData,store);
    //fix names
    for(let c of store.countries){
        matchName(c);
    }
};

async function downloadFile(baseUrl, filename) {
    return new Promise((resolve, reject) => {
        const path = Path.resolve(__dirname, "files", filename);
        const writer = Fs.createWriteStream(path);
        writer.on("open", async () => {
            const response = await Axios({
                url: baseUrl,
                method: "GET",
                responseType: "stream",
            });

            response.data.pipe(writer);
        });
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

function makeHistory(store,rawData,dates) {
    const entries = Object.entries(rawData);
    const global = {
        today: { toll: 0, recovered: 0, deaths: 0, sick: 0 },
        history: { toll: {}, recovered: {}, deaths: {}, sick: {} }
    };
    let countries = [];
    let i = 0;
    // iterate over types
    for (let [typeName, type] of entries) {
        // iterate over rows
        for (let row of type) {
            //rowEntries = Object.entries(row);
            let k = countries.findIndex(c => c.name === row["Country/Region"]);
            if(k != -1){
                // iterate over dates
                //let newCases;
                for(date of dates){
                    if(row[date]){
                        countries[k].history[typeName][date] += Number(row[date]);
                    }
                }
            }else{
                let newCountry = {
                    id:i,
                    name:row["Country/Region"],
                    today: { toll: 0, recovered: 0, deaths: 0, sick: 0 },
                    history: { toll: {}, recovered: {}, deaths: {}, sick: {} }
                };
                // iterate over dates
                for(date of dates){
                    newCountry.history.toll[date] = 0;
                    newCountry.history.recovered[date] = 0;
                    newCountry.history.deaths[date] = 0;
                    newCountry.history.sick[date] = 0;
                    if(row[date]) newCountry.history[typeName][date] += Number(row[date]);
                }
                countries.push(newCountry);
                i++;
            }
        }
    }
    calculateSick(countries,dates);
    store.countries = countries;
    store.global = global;
}

function calculateSick(countries,dates){
    for(let country of countries){
        for(let date of dates){
            let toll = country.history.toll[date] || 0;
            let recovered = country.history.recovered[date] || 0;
            let deaths = country.history.deaths[date] || 0;
            country.history.sick[date] = toll - (recovered + deaths);
        }
    }
}

function makeGlobalHistory(store,dates){
    for(let date of dates){
        store.global.history.toll[date] = 0;
        store.global.history.recovered[date] = 0;
        store.global.history.deaths[date] = 0;
        store.global.history.sick[date] = 0;
    }
    for(let country of store.countries){
        for(let date of dates){
            store.global.history.toll[date] += country.history.toll[date];
            store.global.history.recovered[date] += country.history.recovered[date];
            store.global.history.deaths[date] += country.history.deaths[date];
            store.global.history.sick[date] += country.history.sick[date];
        }
    }
}

function estimateToday(store,dates){
    //console.log(store.countries[0].today);
    
    for(let country of store.countries){
        
        country.today.toll = country.history.toll[dates[dates.length-1]];
        country.today.recovered = country.history.recovered[dates[dates.length-1]];
        country.today.deaths = country.history.deaths[dates[dates.length-1]];
        country.today.sick = country.history.sick[dates[dates.length-1]];
        
        store.global.today.toll += country.today.toll;
        store.global.today.recovered += country.today.recovered;
        store.global.today.deaths += country.today.deaths;
        store.global.today.sick += country.today.sick;
    }
}

function toGeoJson(rawDataObj, store) {
    let rawToll = rawDataObj.toll;
    let rawRecovered = rawDataObj.recovered;
    let rawDeaths = rawDataObj.deaths;
    let geoJson = {
        type: "FeatureCollection",
        features: []
    };
    let i = 0;
    for (row of rawToll) {
        let thisCountry;
        for (country of store.countries) {
            if (row["Country/Region"] === country.name) {
                thisCountry = country;
                break;
            }
        }
        let tol = Object.values(row);
        let rec = [0];
        if (rawRecovered[i]) {
            rec = Object.values(rawRecovered[i]);
        }
        let ded = [0];
        if (rawDeaths[i]) {
            ded = Object.values(rawDeaths[i]);
        }
        let newFeature =
            row["Province/State"] === ""
                ? {
                      type: "Feature",
                      geometry: {
                          type: "Point",
                          coordinates: [Number(row["Long"]), Number(row["Lat"])]
                      },
                      properties: {
                          region: row["Province/State"],
                          country: row["Country/Region"],
                          countryId: thisCountry.id,
                          toll: thisCountry.today.toll,
                          recovered: thisCountry.today.recovered,
                          deaths: thisCountry.today.deaths,
                          sick: null
                      }
                  }
                : {
                      type: "Feature",
                      geometry: {
                          type: "Point",
                          coordinates: [Number(row["Long"]), Number(row["Lat"])]
                      },
                      properties: {
                          region: row["Province/State"],
                          country: row["Country/Region"],
                          countryId: thisCountry.id,
                          toll: Number(tol[tol.length - 1]),
                          recovered: Number(rec[rec.length - 1]),
                          deaths: Number(ded[ded.length - 1]),
                          sick: null
                      }
                  };
        newFeature.properties.sick =
            newFeature.properties.toll -
            (newFeature.properties.recovered + newFeature.properties.deaths);
        geoJson.features.push(newFeature);
        i++;
    }
    store.geoJson = geoJson;
}
