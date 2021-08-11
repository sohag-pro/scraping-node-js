require("dotenv").config();
const debug = require("debug")("app");
const puppeteer = require("puppeteer");
const fs = require("fs");
const converter = require('json-2-csv');

let details = [];

(async() => {
    fs.readdirSync('all').forEach(file => {
        if (file.includes('all')) {
            var detail_chunk = JSON.parse(fs.readFileSync(`all/${file}`, 'utf8'));
            details.push(detail_chunk)
        }
    });

    var all_details = [].concat.apply([], details);

    var mapped = all_details.map(x => {
        var y = {}
        Object.assign(y, x);
        delete y.category
        for(var i = 0; i < 178; i++){
            y[`category${i}`] = typeof x.category[i] === 'undefined' ? "" : x.category[i]
        }
        return y
    })

    console.log(mapped[0])

    // convert JSON array to CSV string
    converter.json2csv(mapped, (err, csv) => {
        if (err) {
            throw err;
        }
        // write CSV to a file
        fs.writeFileSync('company/all_details.csv', csv);
        
    });

    // fs.writeFile(`company/all_details.json`, JSON.stringify(all_details), function(err) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     console.log('file saved')
    // });
    console.log('details collected: ' + all_details.length)
    console.log('exited')
})();