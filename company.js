require("dotenv").config();
const debug = require("debug")("app");
const puppeteer = require("puppeteer");


let urls = [];
let market_urls = [];
let company_urls = [];
let details = [];
let count = 1;
let details_count = 1;
let link_count = 1;
let from = 2051; //page limit
let limit = 2100; //page limit

const fs = require("fs");

(async() => {
    const browser = await puppeteer.launch();
    console.log('browser launched')
    const page = await browser.newPage();
    console.log('Tab opened')

    var category_markets = JSON.parse(fs.readFileSync('data/market.json', 'utf8'));
    console.log('Links ready', link_count)

    for (category in category_markets) {
        console.log('Trying Category No: ' + category)
        await get_company_list(category_markets[category], page)
    }

    console.log(`writing data in file: company-${from}-${limit}.json`)
    var all_company_urls = [].concat.apply([], company_urls);
    fs.writeFile(`data/company-${from}-${limit}.json`, JSON.stringify(all_company_urls), function(err) {
        if (err) {
            console.log(err);
        }
    });

})();

async function get_company_list(category, page) {
    console.log('Reading market links list')
    for (market in category.market_urls) {

        var marketUrl = category.market_urls[market]

        console.log('checking market valid link. Current Limit: ', from, limit, link_count)
        if (marketUrl.includes("https") && link_count <= limit) {
            if (link_count >= from) {
                console.log('trying company list')
                await get_company_urls(page, marketUrl, category.name)
            }
            link_count++

        }

        if ((link_count - 1) == limit && (link_count - 1) > from) {
            console.log(`writing data in file: company-${from}-${limit}.json`)
            var all_company_urls = [].concat.apply([], company_urls);
            fs.writeFile(`data/company-${from}-${limit}.json`, JSON.stringify(all_company_urls), function(err) {
                if (err) {
                    console.log(err);
                }
            });

            from = limit + 1
            limit = limit + 50
            company_urls = []
        }
    }
}

async function get_company_urls(page, next, category_name) {
    console.log(`Page no: ${count}`);
    count++;
    await page.setDefaultNavigationTimeout(0);
    await page.goto(next);
    let links = await page.evaluate(() => {
        return [...document.querySelectorAll(".geocat-featured-sp-list__cta-title-link")].map((e) =>
            e.getAttribute("href")
        );
    });
    var category = {
        category: category_name,
        links
    }
    console.log(links)
    company_urls.push(category);
}