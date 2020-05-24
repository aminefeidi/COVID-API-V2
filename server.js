const express = require("express");
const config = require("config");
const cors = require("cors");
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3000;

const routeModule = require("./routes/routes.index");
const mainLoader = require("./loaders/main.loader");

let app = express();

(async () => {
	app.use(cors());
	app.use(bodyParser.json());

	let prod = config.get("prod");

	console.time("bootstrapped");
	try {
		await mainLoader.loadSources();
		console.timeEnd("bootstrapped");
	} catch (error) {
		console.error(error);
		process.exit(1);
	}

	if (prod) {
		setInterval(async () => {
			console.time("bootstrapped");
			try {
				await mainLoader.loadSources();
				console.timeEnd("bootstrapped");
			} catch (error) {
				console.error(error);
			}
		}, 3600000 / 2);
	}

	routeModule(app);

	app.listen(PORT, () =>
		console.log(`express server is running on port ${PORT}`)
	);
})();
