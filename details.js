require("dotenv").config();
const debug = require("debug")("app");
const puppeteer = require("puppeteer");
const fs = require("fs");


let urls = [];
let market_urls = [];
let company_urls = [];
let details = [];
let count = 1;
let details_count = 1;
let link_count = 1;
let from = 1; //page limit
let limit = 2; //page limit


(async() => {
    const browser = await puppeteer.launch();
    console.log('browser launched')
    const page = await browser.newPage();
    console.log('Tab opened')

    fs.readdirSync('data').forEach(file => {
        if (file.includes('company')) {
            var category_markets = JSON.parse(fs.readFileSync(`data/${file}`, 'utf8'));
            for (x in category_markets) {
                var links = category_markets[x].links
                for (y in links) {
                    var link = links[y]
                    var region = link.split('/')[3]
                    if (region == 'nv' || region == 'ga') {
                        company_urls.push(link)
                    }
                }
            }
        }
    });

    var unique_companies = company_urls.filter((x, i) => i === company_urls.indexOf(x))
    unique_companies.sort()

    link_count = unique_companies.length
    for (z in unique_companies) {
        await get_details(page, unique_companies[z])

        if (count % 10 == 0) {
            fs.writeFile(`data/ga-nv_details-${count}.json`, JSON.stringify(details), function(err) {
                if (err) {
                    console.log(err);
                }
                console.log('file saved')
                details = []
            });
        }

    }

    fs.writeFile(`data/ga-nv_details-${count}.json`, JSON.stringify(details), function(err) {
        if (err) {
            console.log(err);
        }
        console.log('file saved')
    });
    console.log('details collected: ' + unique_companies.length)
    console.log('exited')
})();


async function get_details(page, link) {

    console.log(`Page no: ${count}, Left: ${link_count - count}`);
    count++;
    if (true) {
        console.log('link: ' + link)
        await page.setDefaultNavigationTimeout(0);
        await page.goto("https://www.angi.com" + link);

        let name = ''
        try {
            name = await page.evaluate(() => {
                return document.getElementById('crumb-leaf-7').innerHTML
            });
        } catch (error) {}

        let description = ''
        try {
            description = await page.evaluate(() => {
                return document.getElementById('leaf-description-expandable').innerText.replaceAll('\n', ' ')
            });
            if (description.includes('Read more')) {
                await page.click('#description-more-btn')
                description = await page.evaluate(() => {
                    return document.getElementById('leaf-description-expandable').innerText.replaceAll('\n', ' ').replaceAll('Read less', '')
                });
            }
        } catch (error) {}

        let phone = ''
        try {
            await page.click('#contact-info-show-phone-number')
            phone = await page.evaluate(() => {
                return document.getElementById('contact-info-primary-phone-number').innerText
            });
        } catch (error) {}

        let category = ''
        try {
            category = await page.evaluate(() => {
                return [...document.querySelectorAll(".service-category__element a")].map((e) =>
                    e.getAttribute("title")
                )
            });
        } catch (error) {}

        let address = ''
        try {
            address = await page.evaluate(() => {
                return [...document.querySelectorAll(".contact-info__content p")].map((e) =>
                    e.innerText
                ).join(' ')
            });
        } catch (error) {}

        if (name != '') {

            var detail = {
                name,
                category,
                description,
                phone,
                address
            }

            details.push(detail);
            console.log(detail)
        } else {
            console.log('name not found')
        }
    }
}