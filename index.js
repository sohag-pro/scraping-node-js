require("dotenv").config();
const debug = require("debug")("app");
const axios = require("axios");
const cheerio = require("cheerio");

// axios("http://bikroy.com").then((res) => console.log(res.data));

async function main(){
    debug("fetching");
    let res = await axios("http://bikroy.com");
    debug("fetching done");
    let data = await res.data;
    debug("data extracting");
    const $ = await cheerio.load(data);
    debug("data loading");
    debug($('h1').text());
    debug("data print");
}

main();