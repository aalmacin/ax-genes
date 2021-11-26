const { AxieGene } = require("agp-npm/dist/axie-gene");
const fetch = require("node-fetch");

(async () => {
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