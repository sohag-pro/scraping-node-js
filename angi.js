require("dotenv").config();
const debug = require("debug")("app");
const puppeteer = require("puppeteer");


let urls = [];
let market_urls = [];
let details = [];
let count = 1;
let details_count = 1;
let limit = 5; //page limit


(async () => {
    debug("Opening Browser");
    const browser = await puppeteer.launch();
    debug("Opening New Tab");
    const page = await browser.newPage();
    debug("Going to site");
    let home_page = "https://www.angi.com/companylist/";

    await page.goto(home_page);
    let links = await page.evaluate(() => {
        return [...document.querySelectorAll(".generator-static-list .generator-link")].map((e) =>
          { 
              return { 
                  "url" : e.getAttribute("href"),
                  "name" : e.getAttribute("title")
                } 
        }
        );
      });
    urls.push(links);
  
    var all_urls = [].concat.apply([], urls);
    for (x in all_urls) {
        await get_market_urls(page, all_urls[x]);
    }

    var all_market_urls = [].concat.apply([], market_urls);
  
    debug("closing Browser");
    await browser.close();
    debug("Browser Closed");
    // console.log(all_urls);
    console.log(details);
    const fs = require("fs");
    fs.writeFile("data/data1.json", JSON.stringify(all_urls), function (err) {
      if (err) {
        console.log(err);
      }
    });
    fs.writeFile("data/market.json", JSON.stringify(all_market_urls), function (err) {
      if (err) {
        console.log(err);
      }
    });
  })();

  async function get_market_urls(page, next) {
    debug("going to new page");
    console.log(`Page no: ${count}`);
    count++;
    await page.goto("https://www.angi.com" + next.url);
    debug("checking all urls");
    let links = await page.evaluate(() => {
        return [...document.querySelectorAll(".geocat-cities-list__item a")].map((e) =>
            e.getAttribute("href")
        );
      });
      console.log(links)
    debug("pusing urls to global var");
    next.market_urls = links
    market_urls.push(next);
  }