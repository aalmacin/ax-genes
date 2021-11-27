const fetchAPI = require("node-fetch")
const {Datastore} = require('@google-cloud/datastore');
const { AxieGene } = require("agp-npm/dist/axie-gene");
const queries = require('./queries');
const datastore = new Datastore();
const cache = require('memory-cache');

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
    console.log("Get axie from graphql api")
    return responseJson.data.axie;
}

async function getAxieFromDatastore(axieId: string) {
    const query = datastore.createQuery('Axie')
        .filter('id', axieId);
    const [axie] = await datastore.runQuery(query);
    if(axie.length !== 0) {
        return axie[0];
    }
    console.log("Get axie from datastore")
    return undefined;
}

async function getAxiesFromMarketPlace() {
    const marketResponse = await fetchAPI("https://graphql-gateway.axieinfinity.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: queries.GetAxieBriefList,
            variables: {
                "from": 0,
                "size": 10000000,
                "sort": "PriceAsc",
                "auctionType": "Sale",
                "owner": null,
                "criteria": {
                  "region": null,
                  "parts": [
                    "tail-yam",
                    "tail-carrot",
                    "back-pumpkin",
                    "mouth-serious",
                    "horn-cactus"
                  ],
                  "bodyShapes": null,
                  "classes": [
                    "Plant"
                  ],
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
    return res.data.axies.results;
}

(async () => {
    const axies = await getAxiesFromMarketPlace();
    // TODO: Loop
    const fAxie = axies[0]
    const axieCurrentPrice = {currentPrice: fAxie.auction.currentPriceUSD}

    if(fAxie.battleInfo && fAxie.battleInfo.banned) {
        return;
    }

    let axieGenes = cache.get(fAxie.id);
    if(!axieGenes) {
        let axie = await getAxieFromDatastore(fAxie.id);
        const isAxieInDatastore = axie !== undefined;

        if(isAxieInDatastore) {
            axieGenes = {
                ...axie, 
            };
        } else {
            axie = await getAxieDetail(fAxie.id)

            if(!axie) {
                throw new Error("Could not find axie in datastore and api");
            }

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

        cache.put(axieGenes.id, axieGenes, 1000 * 60 * 60 * 24 * 7);
    } else {
        console.log("Get axie from cache")
    }

    const returnData = {
        ...axieGenes,
        ...axieCurrentPrice
    }
    console.log(returnData)
})();