require("dotenv").config();
const debug = require("debug")("app");
const puppeteer = require("puppeteer");

let urls = [];
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
  let home_page = "https://www.psychologytoday.com/us/therapists/illinois";
  await next_page(page, home_page);

  var all_urls = [].concat.apply([], urls);

  for (x in all_urls) {
    await get_details(page, all_urls[x]);
  }

  debug("closing Browser");
  await browser.close();
  debug("Browser Closed");
  // console.log(all_urls);
  console.log(details);
  const fs = require("fs");
  fs.writeFile("data/data.json", JSON.stringify(details), function (err) {
    if (err) {
      console.log(err);
    }
  });
})();

async function next_page(page, next) {
  debug("going to new page");
  console.log(`Page no: ${count}`);
  count++;
  await page.goto(next);
  debug("checking all urls");

  let links = await page.evaluate(() => {
    return [...document.querySelectorAll(".result-name")].map((e) =>
      e.getAttribute("href")
    );
  });

  debug("pusing urls to global var");
  urls.push(links);

  debug("Getting Next Link");
  next = await page.evaluate(() => {
    const element = document.querySelector(".btn-lg.btn-next");
    return element && element.getAttribute("href");
  });

  debug("going to next page");
  console.log(next);
  if (next && limit >= count) {
    await next_page(page, next);
  }
}

async function get_details(page, pageToGo) {
  debug("going to new details page");
  console.log(`Details Page no: ${details_count}`);
  details_count++;
  await page.goto(pageToGo);

  debug("Getting Name");
  let name = await page.evaluate(() => {
    const element = document.querySelector('[itemprop="name"]');
    return element && element.innerText;
  });
  debug("Getting phone");
  let phone = await page.evaluate(() => {
    element = document.querySelector('[data-event-label="Profile_PhoneLink"]');
    return element && element.innerText;
  });
  debug("Getting Website");
  let website_redi = await page.evaluate(() => {
    element = document.querySelector('[data-event-label="website"]');
    return element && element.getAttribute("href");
  });

  let website = null;
  try {
    if (website_redi) {
      debug("getting personal website");
      const response = await page.goto(website_redi);
      const chain = response.request().redirectChain();
      if (chain.length) {
        website = chain[chain.length - 1].url();
      }
    }
  } catch (err) {
    console.log(err.message);
  }

  debug("making details obj");
  var detailsObj = {
    serial: details_count - 1,
    name,
    phone,
    website,
  };
  debug("pusing details to global var");
  details.push(detailsObj);
}
