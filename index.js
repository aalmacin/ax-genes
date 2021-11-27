const {Datastore} = require('@google-cloud/datastore');
const { AxieGene } = require("agp-npm/dist/axie-gene");
const fetch = require("node-fetch");
const queries = require('./queries');
const datastore = new Datastore();

async function getAxieDetail(axieId) {
    const response =  await fetch("https://axieinfinity.com/graphql-server-v2/graphql", {
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
}

async function axieNotInDatastore(axieId) {
    const query = datastore.createQuery('Axie')
        .filter('axieId', axieId);
    const [axie] = await datastore.runQuery(query);
    console.log(axie)
    return axie.length === 0;
}

(async () => {
    const marketResponse = await fetch("https://graphql-gateway.axieinfinity.com/graphql", {
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
    const axies = res.data.axies.results;
    const fAxie = axies[0]

    if(axie.battleInfo && axie.battleInfo.banned) {
        return;
    }

    let currentAxieGenes;
    let axie;
    if(axieNotInDatastore(fAxie.id)) {
        axie = await getAxieDetail(fAxie.id)
        const axieGene = new AxieGene(axie.genes);
        currentAxieGenes = axieGene._genes;
    }

    if(!currentAxieGenes || !axie) {
        throw new Error("Could not find axie in datastore and api");
    }

    // TODO: Auction data must be updated all the time
    const combinedData = {
        id: axie.id,
        name: axie.name,
        class: currentAxieGenes.cls,
        breedCount: axie.breedCount,
        image: axie.figure.image,
        currentPrice: axie.auction.currentPriceUSD,
        eyes: currentAxieGenes.eyes,
        ears: currentAxieGenes.ears,
        horn: currentAxieGenes.horn,
        mouth: currentAxieGenes.mouth,
        back: currentAxieGenes.back,
        tail: currentAxieGenes.tail,
    }
    const kind = "Axie"

    const taskKey = datastore.key([kind, combinedData.id]);

    // await datastore.save({
    //     key: taskKey,
    //     data: combinedData
    // })

    console.log(combinedData)
})();