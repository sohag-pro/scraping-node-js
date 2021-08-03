require("dotenv").config();
const debug = require("debug")("app");
const puppeteer = require("puppeteer");
const fs = require("fs");

let details = [];

(async() => {
    fs.readdirSync('data').forEach(file => {
        if (file.includes('ga-nv')) {
            var detail_chunk = JSON.parse(fs.readFileSync(`data/${file}`, 'utf8'));
            details.push(detail_chunk)
        }
    });

    var all_details = [].concat.apply([], details);
    fs.writeFile(`company/ga-nv_details.json`, JSON.stringify(all_details), function(err) {
        if (err) {
            console.log(err);
        }
        console.log('file saved')
    });
    console.log('details collected: ' + all_details.length)
    console.log('exited')
})();