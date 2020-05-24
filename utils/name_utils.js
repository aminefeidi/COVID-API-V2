const nameUtils = {};

nameUtils.matchName = (c) => {
    if (c.name === "US") c.name = "USA";
    if (c.name === "Korea, South)") c.name = "S. Korea";
    if (c.name === "North Macedonia") c.name = "Macedonia";
    if (c.name === "United Kingdom") c.name = "UK";
    if (c.name === "Syria") c.name = "Syrian Arab Republic";
    if (c.name === "Libya") c.name = "Libyan Arab Jamahiriya";
    if (c.name === "Congo (Brazzaville)") c.name = "Congo";
    if (c.name === "Cote d'Ivoire") c.name = "Côte d'Ivoire";
    if (c.name === "Holy See") c.name = "Holy See (Vatican City State)";
    if (c.name === "Moldova") c.name = "Moldova, Republic of";
    if (c.name === "Taiwan*") c.name = "Taiwan";
    if (c.name === "United Arab Emirates") c.name = "UAE";
    if (c.name === "Laos") c.name = "Lao People's Democratic Republic";
    if (c.name === "West Bank and Gaza") c.name = "Palestinian Territory, Occupied";
}

module.exports = nameUtils;