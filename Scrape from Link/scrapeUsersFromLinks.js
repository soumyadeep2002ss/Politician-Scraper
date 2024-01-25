const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

puppeteer.use(StealthPlugin());

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

async function scrapeUserInfo(page, userUrl, csvWriter) {
    try {
        let i=0;
        const csvWriter = createCsvWriter({
            path: `Output/easternEUNew.csv`,
            header: [
                { id: 'name', title: 'Name' },
                { id: 'bio', title: 'Bio' },
                { id: 'productHuntUrl', title: 'Product Hunt URL' },
                { id: 'followerCount', title: 'Follower Count' },
                { id: 'pointCount', title: 'Point Count' },
                { id: 'about', title: 'About' },
                { id: 'linksString', title: 'Links' },
            ],
            append: true,
        });
        i++;
        await page.goto(userUrl);

        const name = await page.$eval('.mb-1.color-darker-grey.fontSize-24.fontWeight-600.noOfLines-undefined', element => element.textContent.trim());
        const bio = await page.$eval('.mb-1.color-lighter-grey.fontSize-18.fontWeight-300.noOfLines-undefined', element => element.textContent.trim());
        const productHuntUrl = userUrl;
        const followerCount = parseInt(await page.$eval('a[href$="/followers"]', element => element.textContent));
        const pointCountElement = await page.$('.styles_badge__V9ra4 span');
        const pointCount = pointCountElement ? parseInt(await pointCountElement.evaluate(element => element.textContent)) : 0;
        const aboutElement = await page.$('.styles_aboutText__AnpTz');
        const about = aboutElement ? await aboutElement.evaluate(element => element.textContent.trim().replace(/\n/g, '')) : '';
        const links = await page.$$eval('.styles_links__VhmRM a', elements => elements.map(element => element.href));
        const linksString = links.join('\n');
        console.log(linksString)
        // Skip appending if links are empty
        if (links.length === 0) {
            console.log(`Skipping user ${name} with empty links.`);
            return;
        }
        const userData = {
            name,
            bio,
            productHuntUrl,
            followerCount,
            pointCount,
            about,
            linksString
        };

        await csvWriter.writeRecords([userData]); // Append the user data to CSV
        console.log(`Worker ${workerData.index} - User data appended to CSV for ${name}`);

    } catch (error) {
        console.error('Error scraping user info:', error);
    }
}

if (isMainThread) {
    async function searchAndScrapeUsers() {
        try {
            const userLinks = require('./links1.json'); // Read user links from data.json

            console.log('Total users to scrape:', userLinks.length);

            const numThreads = 16; // Number of worker threads
            const chunkSize = Math.ceil(userLinks.length / numThreads);

            const workers = [];

            for (let i = 0; i < numThreads; i++) {
                const start = i * chunkSize;
                const end = start + chunkSize;
                const linksChunk = userLinks.slice(start, end);

                const worker = new Worker(__filename, {
                    workerData: {
                        index: i,
                        userLinks: linksChunk,
                    },
                });

                workers.push(worker);
            }

            for (const worker of workers) {
                await new Promise(resolve => {
                    worker.on('message', resolve);
                });
            }

            console.log('All worker threads have completed.');

        } catch (error) {
            console.error('Error searching and scraping users:', error);
        }
    }

    searchAndScrapeUsers();
} else {
    const { index, userLinks } = workerData;

    (async () => {
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();

        const csvWriter = createCsvWriter({
            path: `users_${index}.csv`,
            header: [
                { id: 'name', title: 'Name' },
                { id: 'bio', title: 'Bio' },
                { id: 'productHuntUrl', title: 'Product Hunt URL' },
                { id: 'followerCount', title: 'Follower Count' },
                { id: 'pointCount', title: 'Point Count' },
                { id: 'about', title: 'About' },
                { id: 'links', title: 'Links' },
            ],
            append: true,
        });

        for (let i = 0; i < userLinks.length; i++) {
            const userUrl = userLinks[i];
            console.log(`Worker ${index} - Scraping user ${i + 1} of ${userLinks.length} - ${userUrl}`);
            await scrapeUserInfo(page, userUrl, csvWriter);
        }

        await browser.close();
        parentPort.postMessage(`Worker ${index} has completed.`);
    })();
}
