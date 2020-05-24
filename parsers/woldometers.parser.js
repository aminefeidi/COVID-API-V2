const config = require("config");
const tabletojson = require("tabletojson").Tabletojson;
const { toNumber } = require("./../utils/number_utils");

const url = config.get("wmUrl");

async function updateToday(countries, tab) {
	for (let item of tab) {
		for (let country of countries) {
			if (item["Country,Other"] === country.name) {
				country.today.toll = toNumber(item["TotalCases"]);
				country.today.recovered = toNumber(item["TotalRecovered"]);
				country.today.deaths = toNumber(item["TotalDeaths"]);
				country.today.sick = toNumber(item["ActiveCases"]);
				break;
			}
		}
	}
}

async function updateGlobal(global, tab) {
	//console.log(tab[0]);
	global.today.toll = toNumber(tab[0]["TotalCases"]);
	global.today.recovered = toNumber(tab[0]["TotalRecovered"]);
	global.today.deaths = toNumber(tab[0]["TotalDeaths"]);
	global.today.sick = toNumber(tab[0]["ActiveCases"]);
}

module.exports = async store => {
	let tab;
	tab = (await tabletojson.convertUrl(url))[0];
	updateToday(store.countries, tab);
	updateGlobal(store.global, tab);
};
