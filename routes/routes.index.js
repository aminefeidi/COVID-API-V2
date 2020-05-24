const moment = require("moment");
const storage = require("node-persist");

module.exports = app => {
	app
		.get("/api/all", async (req, res) => {
			let data = await storage.getItem("countries");
			res.json(data);
		})

		.get("/api/global", async (req, res) => {
			let data = await storage.getItem("global");
			res.json(data);
		})

		.get("/api/country/:id", async (req, res) => {
			let id = Number(req.params.id);
			let data = await storage.getItem("countries");
			if (id < 1 || id > data.length) res.status(404);
			res.json(data[id - 1]);
		})

		.get("/api/countries", async (req, res) => {
			let data = await storage.getItem("countryList");
			res.json(data);
		})

		.get("/api/lastUpdate", async (req, res) => {
			let now = moment();
			let lastUpdated = await storage.getItem("lastUpdated");
			res.json(now.diff(lastUpdated));
		})

		.get("/api/geoJson", async (req, res) => {
			let data = await storage.getItem("geojson");
			res.json(data);
		})
};
