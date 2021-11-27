const fetchAPI = require("node-fetch")
const {Datastore} = require('@google-cloud/datastore');
const { AxieGene } = require("agp-npm/dist/axie-gene");
const queries = require('./queries');
const datastore = new Datastore();
const redis = require('redis');
const redisClient = redis.createClient()

const winston = require('winston');

const DailyRotateFile = require('winston-daily-rotate-file');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    winston.transports.Console(),
    new DailyRotateFile({ filename: 'error.log', level: 'error' }),
    new DailyRotateFile({ filename: 'combined.log' }),
  ],
});

redisClient.on('error', (err: any) => logger.error('Redis Client Error', err));


// TODOS:
// 1. Memory cache
// 2. React app

type AxieGenes = {
    id: any;
    name: any;
    class: any;
    breedCount: any;
    image: any;
    eyes: any;
    ears: any;
    horn: any;
    mouth: any;
    back: any;
    tail: any;
}

async function getAxieDetail(axieId: string) {
    try {
        const response =  await fetchAPI("https://axieinfinity.com/graphql-server-v2/graphql", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: queries.GetAxieDetail,
                variables: {
                    axieId
                }
            })
        })
        const responseJson = await response.json();
        return responseJson.data.axie;
    } catch (e) {
        logger.error("Failed to get Axie detail for", axieId);
        logger.error(e);
    }
}

async function getAxieFromDatastore(axieId: string) {
    const query = datastore.createQuery('Axie')
        .filter('id', axieId);
    const [axie] = await datastore.runQuery(query);
    if(axie.length !== 0) {
        return axie[0];
    }
    return undefined;
}

const getAxies = async ({from, size}: any) => {
    const marketResponse = await fetchAPI("https://graphql-gateway.axieinfinity.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: queries.GetAxieBriefList,
            variables: {
                "from": from,
                "size": size,
                "sort": "PriceAsc",
                "auctionType": "Sale",
                "owner": null,
                "criteria": {
                    "region": null,
                    "parts": null,
                    "bodyShapes": null,
                    "classes": null,
                    "stages": null,
                    "numMystic": null,
                    "pureness": null,
                    "title": null,
                    "breedable": null,
                    "breedCount": null,
                    "hp": [],
                    "skill": [],
                    "speed": [],
                    "morale": []
                },
                "filterStuckAuctions": true
            } 
        })
    });
    const res = await marketResponse.json();
    return res.data;
}


(async () => {
    await redisClient.connect();
    const firstRes = await getAxies({from: 0, size: 100});
    let axies = firstRes.axies.results
    const pages = firstRes.axies.total / 100;

    let completed = 0;
    let page = 0;
    do {
        if(page !== 0) {
            const res = await getAxies({from: page * 100, size: 100});
            axies = res.axies.results
        }
        const axiePromises = axies.map(async (currAxie: any) => {
            // const axieCurrentPrice = {currentPrice: currAxie.auction.currentPriceUSD}

            if(currAxie.battleInfo && currAxie.battleInfo.banned) {
                return;
            }

            let dataFrom = 'Cache'
            let axieGenes = await redisClient.get(currAxie.id);
            if(!axieGenes) {
                let axie = await getAxieFromDatastore(currAxie.id);
                const isAxieInDatastore = axie !== undefined;

                if(isAxieInDatastore) {
                    dataFrom = 'Datastore'
                    axieGenes = {
                        ...axie, 
                    };
                } else {
                    axie = await getAxieDetail(currAxie.id)

                    if(!axie) {
                        throw new Error("Could not find axie in datastore and api");
                    }
                    dataFrom = 'API'

                    const axieGene = new AxieGene(axie.genes);
                    const genesData = axieGene._genes;
                    axieGenes = {
                        id: axie.id,
                        name: axie.name,
                        breedCount: axie.breedCount,
                        image: axie.figure.image,
                        class: genesData.cls,
                        eyes: genesData.eyes,
                        ears: genesData.ears,
                        horn: genesData.horn,
                        mouth: genesData.mouth,
                        back: genesData.back,
                        tail: genesData.tail,
                    };
                    const kind = "Axie"
                    const taskKey = datastore.key([kind, axieGenes.id]);
                    await datastore.save({
                        key: taskKey,
                        data: axieGenes
                    })
                }

                await redisClient.set(axieGenes.id, JSON.stringify(axieGenes));
            } else {
                axieGenes = JSON.parse(axieGenes);
            }

            // const returnData = {
            //     ...axieGenes,
            //     ...axieCurrentPrice
            // }
            // console.log(dataFrom, returnData)
            completed++;
        })
        await Promise.all(axiePromises.map((p: Promise<any>) => p.then(() => logger.info("COMPLETED: ", completed)).catch(e => logger.info("COMPLETED: ", completed, e))))

        page++;
    } while(page <= pages)
    redisClient.quit();
})();