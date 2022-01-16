const axios = require("axios");
const config = require('config');
let key = config.get('ipStackPrivateKey');

module.exports = async function (ip) {
    let response;

    try {
        response = await axios.get(
            "http://api.ipstack.com/" +
                ip +
                "?access_key="+key+"&format=1"
        );
    
        if (response.status !== 200) {
            throw new Error("Network error");
        }
        if (!response.data.country_name || response.data.success === false) {
            throw new Error("Invalid Ip");
        }

        return response.data;

    } catch (error) {
        console.log(error);
        
        return null
    }

    
};
