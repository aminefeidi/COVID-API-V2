const moment = require("moment");
const storage = require("node-persist");
const notifier = require("./../utils/notifier");
const userCountry = require("../utils/ip_utils");

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
			let data = await storage.getItem("countries_history");
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
		.get("/api/userCountry/:ip", async (req, res) => {
			let ip = req.params.ip;
			let data = await userCountry(ip);
			if (!data) {
				res.sendStatus(500);
				return;
			}
			res.json(data);
		})
		.post("/api/subscribe", async (req, res) => {
            try {
                let response = await notifier.add(req.body);
                res.sendStatus(200);
            } catch (error) {
                console.log(err);
				res.sendStatus(500);
            }
		})
		.get("/api/sendAll", async (req, res) => {
			try {
				let response = await notifier.send();
				console.log("Notifications sent");
				res.sendStatus(200);
			} catch (error) {
				console.log("error in notify module:", error);
				res.sendStatus(500);
			}
		});
};
