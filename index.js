const { AxieGene } = require("agp-npm/dist/axie-gene");
const fetch = require("node-fetch");

(async () => {
    const marketResponse = await fetch("https://graphql-gateway.axieinfinity.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String, $filterStuckAuctions: Boolean) {
                axies(
                  auctionType: $auctionType
                  criteria: $criteria
                  from: $from
                  sort: $sort
                  size: $size
                  owner: $owner
                  filterStuckAuctions: $filterStuckAuctions
                ) {
                  total
                  results {
                    ...AxieBrief
                    __typename
                  }
                  __typename
                }
              }
              
              fragment AxieBrief on Axie {
                id
                name
                stage
                class
                breedCount
                image
                title
                battleInfo {
                  banned
                  __typename
                }
                auction {
                  currentPrice
                  currentPriceUSD
                  __typename
                }
                parts {
                  id
                  name
                  class
                  type
                  specialGenes
                  __typename
                }
                __typename
              }
            `,
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
    console.log(axies);

    const response =  await fetch("https://axieinfinity.com/graphql-server-v2/graphql", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `query GetAxieDetail($axieId: ID!) {
                axie(axieId: $axieId) {
                ...AxieDetail
                __typename
                }
            }
            
            fragment AxieDetail on Axie {
                id
                name
                genes
                owner
                birthDate
                bodyShape
                class
                sireId
                sireClass
                matronId
                matronClass
                stage
                title
                breedCount
                level
                figure {
                atlas
                model
                image
                __typename
                }
                parts {
                ...AxiePart
                __typename
                }
                stats {
                ...AxieStats
                __typename
                }
                auction {
                ...AxieAuction
                __typename
                }
                ownerProfile {
                name
                __typename
                }
                children {
                id
                name
                class
                image
                title
                stage
                __typename
                }
                __typename
            }
            
            fragment AxiePart on AxiePart {
                id
                name
                class
                type
                stage
                abilities {
                ...AxieCardAbility
                __typename
                }
                __typename
            }
            
            fragment AxieCardAbility on AxieCardAbility {
                id
                name
                attack
                defense
                energy
                description
                backgroundUrl
                effectIconUrl
                __typename
            }
            
            fragment AxieStats on AxieStats {
                hp
                speed
                skill
                morale
                __typename
            }
            
            fragment AxieAuction on Auction {
                startingPrice
                endingPrice
                startingTimestamp
                endingTimestamp
                duration
                timeLeft
                currentPrice
                currentPriceUSD
                suggestedPrice
                seller
                listingIndex
                __typename
            }
            `,
            variables: {
                axieId: '6613417'
            }
        })
    })
    const responseJson = await response.json();
    const axie = responseJson.data.axie;

    const axieGene = new AxieGene(axie.genes);
    console.log(axieGene._genes);
})();