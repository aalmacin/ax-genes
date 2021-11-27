module.exports = {
    GetAxieBriefList: `query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String, $filterStuckAuctions: Boolean) {
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
    GetAxieDetail: `query GetAxieDetail($axieId: ID!) {
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
    `
}