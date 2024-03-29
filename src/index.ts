/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="d3" />
/// <reference path="./common.ts" />
// import d3 from 'd3'
// import { Item, Recipe } from './common'

enum StoreIdentifier {
    Outpost = "outpost",
    City = "city",
    Research = "research",
    Military = "military",
    Mine = "mine",
    Armory = "armory",  // special merchants?
    Engineering = "engineering",  // special merchants?
    Medical = "medical",  // special merchants?
}
enum ShopSuggestion {
    Trash = 'trash',
    Sell = 'sell',
    SellPremium = 'sell premium',
    Hold = 'hold',
    BuyDiscounted = 'buy discounted',
    Buy = 'buy',
}
enum Suggestion {
    Consume = 'consume',
    Sell = 'sell',
    Deconstruct = 'deconstruct',
    Fabricate = 'fabricate',
    Trash = 'trash',
}
interface ItemFE extends Item {
    fy: number
    group: string | undefined
    baseValue: number
    value: number
    _nextValue: number
    shopSuggestion: ShopSuggestion
    suggestion: Suggestion
    rarity: number
}

interface DisplayNode extends d3.SimulationNodeDatum {
    id: string
    type: 'item' | 'category'
    icon?: Item['icon']
    group?: string
}
interface DisplayLink extends d3.SimulationNodeDatum {
    type: 'item' | 'category' | 'orphan'
    source: DisplayNode
    target: DisplayNode
}
interface Group {
    id: string
    x: number
    member: (item: Item) => boolean
}

const tableRowColor = d3.scaleSqrt([0, 1, 5, 10, 20, 40, 80, 160, 320], d3.schemeSpectral[10])

const format0 = (number: number) => (Math.round(number)).toFixed(0)
const formatValue = (number: number) => (Math.round(number * 10) / 10).toFixed(1)
const formatFraction = (number: number) => (Math.round(number * 100) / 100).toString()
const addSubLine = (node: d3.Selection<any, any, any, any>, item: ItemFE, amount: number) => {
    node.append("span")
        .text(`${formatValue(amount * item.value)}v: `)
    node.append("a")
        .attr("href", `#${item.id}`)
        .text(item.title ?? item.id)
    if(amount !== 1) {
        node.append("span")
            .text(` x${formatFraction(amount)} (${formatValue(item.value)}v)`)
    }
}

(async () => {
    const iconSize = 36
    const strokeWidth = 4
    const priceToHeight = (price: number, category = false) => Math.max(category ? 1 : 2, Math.log2(price)) * 100  // TODO: dynamic height based on window height
    const nodeLinkCountMap = new Map<IdItemString, number>()

    const RECIPES = (await (await fetch('./recipes.json')).json() as Recipe[])
    const ITEMS_RAW = (await (await fetch('./items.json')).json() as Item[])
    const ITEM_LINKS = RECIPES.flatMap((recipe) => [
        ...(Object.keys(recipe.deconstruct?.parts ?? {}).map((partId) => ({source: partId, target: recipe.result}))),
        ...(recipe.fabricate?.flatMap((fab) => Object.keys(fab.parts).map((partId) => ({source: partId, target: recipe.result}))) ?? []),
    ])
    const TOTAL_HEIGHT = ITEMS_RAW.reduce((max, item) => Math.max(max, priceToHeight(item.price)), 0)

    for(const item of ITEMS_RAW) nodeLinkCountMap.set(item.id, 0)
    for(const itemLink of ITEM_LINKS) {
        nodeLinkCountMap.set(itemLink.source, (nodeLinkCountMap.get(itemLink.source) ?? 0) + 1)
        nodeLinkCountMap.set(itemLink.target, (nodeLinkCountMap.get(itemLink.target) ?? 0) + 1)
    }

    // In order if priority
    const groups: Group[] = [
        {x: 3500, id: "Orphan", member: (item) => (nodeLinkCountMap.get(item.id) ?? 0) === 0},
        {x: 2500, id: "Electrical", member: (item) => !['batterycell', 'fulguriumbatterycell'].includes(item.id) && ( item.categories?.includes('Electrical') || ['tin', 'copper', 'silicon'].includes(item.id))},
        {x: -2000, id: "Alien / Egg", member: (item) => item.id.includes('egg') || ['adrenalinegland', 'alienblood', 'swimbladder', /* 'alientrinket1', 'alientrinket2',  */'mucusball', 'paralyxis'].includes(item.id)},
        {x: -1500, id: "Medic", member: (item) => !['healthscanner', 'autoinjectorheadset'].includes(item.id) && (item.categories?.includes('Medic') || item.categories?.includes('Medical') || ['organicfiber', 'chlorine', 'tonicliquid', 'pomegrenadeextract'].includes(item.id))},
        {x: 0, id: 'Other', member: () => false}
    ]

    // Also, merge 
    // const andComponent = ITEMS_RAW.find((innerItem) => innerItem.id === 'andcomponent')!
    const ITEMS = (window as any).ITEMS = ITEMS_RAW
        .map((item): ItemFE => ({
            ...item,
            fy: TOTAL_HEIGHT - priceToHeight(item.price),
            group: groups.find((group) => group.member(item))?.id,
            baseValue: NaN,
            value: item.price / 4,
            _nextValue: item.price / 4,
            suggestion: Suggestion.Sell,
            shopSuggestion: ShopSuggestion.Sell,
            rarity: 10 / Object.values(item.stores).reduce((sum, store) => sum + (store.sold ? 1 : 0) + (store.minavailable ?? 0), 0.1)
        }))
        // .filter((item) => !item.id.endsWith('wire') || item.id === 'wire')
        // .filter((item) => !item.id.endsWith('component'))
        // .concat({
        //     ...andComponent,
        //     title: 'Wiring Component',
        //     fy: TOTAL_HEIGHT - priceToHeight(andComponent.price),
        //     group: groups.find((group) => group.member(andComponent))?.id,
        // })
    const CATEGORIES = Array.from(new Set(ITEMS_RAW.flatMap(d => d.categories)))

    // Debug
    // ITEMS.splice(20)
    // RECIPES.splice(20)
    // CATEGORIES.splice(20)
    console.log(ITEMS)
    console.log(RECIPES)
    console.log(CATEGORIES)

    const CATEGORY_LINKS = ITEMS_RAW.flatMap((item) => item.categories.map((category) => ({source: category, target: item.id})))

    // const ORPHAN_LINKS = [...nodeLinkCountMap.entries()]
    //     .filter(([_, count]) => count === 0)
    //     .map(([itemId, _]) => ({source: 'orphan', target: itemId}))
    // for(const itemLink of ORPHAN_LINKS) {
    //     nodeLinkCountMap.set(itemLink.source, (nodeLinkCountMap.get(itemLink.source) ?? 0) + 1)
    //     nodeLinkCountMap.set(itemLink.target, (nodeLinkCountMap.get(itemLink.target) ?? 0) + 1)
    // }

    console.log('nodes:', {
        categories: CATEGORIES.length,
        items: ITEMS.length,
        recipes: RECIPES.length,
    })
    console.log('links:', {
        category: CATEGORY_LINKS.length,
        item: ITEM_LINKS.length,
    })

    const drag = (simulation: d3.Simulation<DisplayNode, DisplayLink>) => {

        function dragstarted(event: any, d: DisplayNode) {
            if(!(document.getElementById('drag') as HTMLInputElement).checked) return () => null

            if (!event.active) simulation.alpha(Math.max(0.01, simulation.alpha())).alphaDecay(0).restart();
            d.fx = d.fx ?? d.x;
            d.fy = d.fy ?? d.y;
        }

        function dragged(event: any, d: DisplayNode) {
            if(!(document.getElementById('drag') as HTMLInputElement).checked) return () => null

            d.fx = Object.getPrototypeOf(d).fx ?? event.x;
            d.fy = Object.getPrototypeOf(d).fy ?? event.y;
        }

        function dragended(event: any, d: DisplayNode) {
            if(!(document.getElementById('drag') as HTMLInputElement).checked) return () => null

            if (!event.active) simulation.alphaTarget(0.0).alphaDecay(0.01);
            delete d.fx;  // if fy is set then it's on prototype up, so just delete it here.
            delete d.fy;  // if fy is set then it's on prototype up, so just delete it here.
        }

        return d3.drag<SVGGElement, DisplayNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    const linkColor = d3.scaleOrdinal(groups.map((group) => group.id), d3.schemeCategory10)

    let currentItem: ItemFE | null
    const refreshInfo = () => {
        const hassle = Number((document.getElementById('hassle') as HTMLInputElement).value)
        const info = d3.select<HTMLDivElement, undefined>('#info')
        info.selectAll('*').remove()
        const currentItemTG = currentItem
        if(!currentItemTG) return

        const rect = currentItemTG.icon?.rect
        const svg = info.append('svg')
            .attr("width", iconSize * 4 + strokeWidth/2)
            .attr("height", iconSize * 4 + strokeWidth/2)
            .style('float', 'left')
            .style('margin-right', '1em')

        svg
            .append("rect")
            .attr("width", iconSize * 4 + strokeWidth/2)
            .attr("height", iconSize * 4 + strokeWidth/2)
            .attr("fill", "#bbb")
            .attr("stroke", linkColor((currentItem as any).group ?? 'Other'))
            .attr("stroke-width", strokeWidth);
        svg
            .append("image")
            .attr("href", currentItemTG.icon?.path ? `img/${currentItemTG.icon?.path}` : null)
            .attr("clip-path", rect ? `path('M 0 0 h ${rect[2]} v ${rect[3]} h -${rect[2]} v -${rect[3]}')` : null)
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("x", -rect[0])
            .attr("y", -rect[1])
            .attr("transform", `scale(${iconSize * 4 / Math.max(rect[2], rect[3])})`)

        const infobox = info.append("div")

        infobox.append("h3")
            .text(`${currentItemTG.title}`)
            .style('margin', 0)

        infobox.append("div")
            .text(`ID: ${currentItemTG.id}`)
        infobox.append("div")
            .text(`Buy price: ${format0(currentItemTG.price)}mk`)
        infobox.append("div")
            .text(`Sell price: ${format0(currentItemTG.price / 4)}mk`)
        infobox.append("div")
            .text(`Value: ${formatValue(currentItemTG.value)}v`)
        infobox.append("div")
            .text(`Shop: ${currentItemTG.shopSuggestion}`)
        infobox.append("div")
            .text(`Suggestion: ${currentItemTG.suggestion}`)
        const checkboxDiv = infobox.append("div")
        checkboxDiv.append('span')
            .text('Check for consumption')
        checkboxDiv.append('input')
            .attr('type', 'checkbox')
            .text('Check for consumption')
            .classed('consume', true)
            .attr('id', () => `consume-${currentItemTG.id}`)
            .attr('checked', () => localStorage.getItem(`consume-${currentItemTG.id}`) !== null ? true : null)
            .on('click', (event: MouseEvent) => {
                const id = (event.target as any).id as string
                if(localStorage.getItem(id)) {
                    localStorage.removeItem(id)
                } else {
                    localStorage.setItem(id, "checked")
                }
                onHassleChange()
            })

        info.append("div")
            .style('clear', 'both')

        info.append("h3")
            .text(`Stores`)

        const table = info.append('table')
        const theadrow = table.append('thead').append('tr')
        const thead = theadrow
            .selectAll('td')
            .data(['Store', 'Multiplier', 'Buys', 'Sells', 'Stock'])
            .enter()
            .append('td')
            .text((d) => d)
        const tbody = table.append('tbody')
        const rows = tbody
            .selectAll('tr')
            .data(Object.values(StoreIdentifier))
        const enterRow = rows.enter()
            .append('tr')
        enterRow
            .append('td')
            .classed('id', true)
            .text((d) => d)
        enterRow
            .append('td')
            .classed('multiplier', true)
            .text((d) => currentItemTG.stores[d] ? `${(currentItemTG.stores[d]?.multiplier ?? 1).toFixed(2)}x` : '-')
        enterRow
            .append('td')
            .classed('buys', true)
            .text((d) => currentItemTG.stores[d] ? `${format0((currentItemTG.stores[d]?.multiplier ?? 1) * currentItemTG.price / 4)}mk` : '-')
        enterRow
            .append('td')
            .classed('sells', true)
            .text((d) => currentItemTG.stores[d]?.sold ? `${format0((currentItemTG.stores[d]?.multiplier ?? 1) * currentItemTG.price)}mk` : '-')
        enterRow
            .append('td')
            .classed('sells', true)
            .text((d) => currentItemTG.stores[d]?.sold && currentItemTG.stores[d]?.minavailable ? `${currentItemTG.stores[d]?.minavailable}+` : '-')


        info.append("h3")
            .text(`Deconstruct to`)
        const recipe = RECIPES.find((recipe) => recipe.result === currentItemTG.id)
        if(recipe?.deconstruct) {
            let sum = 0
            for(const [id, amount] of Object.entries(recipe.deconstruct.parts)) {
                const partItem = ITEMS.find((item) => item.id === id)!
                sum += amount * partItem.value
                info.append("div")
                    .call(addSubLine, partItem, amount)
            }
            if(hassle) {
                sum -= hassle
                info.append("div")
                    .text(`-${formatValue(hassle)}v: hassle`)
            }
            info.append('hr')
                .style('width', '2em')
                .style('margin', 0)

            const ratio = sum / currentItemTG.value
            info.append("div")
                .text(`${formatValue(sum)}v (${format0(ratio * 100)}%, ${ratio > 1 ? '+' : ''}${formatValue(sum - currentItemTG.value)}v)`)
                .style('color', ratio > 1.1 ? '#008400' : ratio < 0.9 ? '#840000' : '')
        } else {
            info.append('span').append('em')
                .text('Nothing')
        }

        info.append("h3")
            .text(`Use in Fabrication of`)
        const fabricatesTo = RECIPES.filter((recipe) => recipe.fabricate.some((fab) => Object.keys(fab.parts).some((partId) => partId === currentItemTG.id)))
        if(fabricatesTo.length) {

            const outputs: [number, d3.Selection<HTMLDetailsElement, undefined, null, undefined>][] = fabricatesTo
                .flatMap((recipe) => {
                    return recipe.fabricate
                        .filter((fab) => Object.keys(fab.parts).some((partId) => partId === currentItemTG.id))
                        .map((fab) => {
                            const producedAmount = fab.amount
                            const recipeItem = ITEMS.find((item) => item.id === recipe.result)!
                            const details = d3.create<HTMLDetailsElement>('details')

                            const more = details.append('text')
                            let sum = 0
                            for(const [id, amount] of Object.entries(fab.parts)) {
                                const item = ITEMS.find((item) => item.id === id)!
                                sum += amount/producedAmount * item.value
                                more.append("div")
                                    .call(addSubLine, item, amount/producedAmount)
                            }
                            if(hassle) {
                                sum += hassle
                                more.append("div")
                                    .text(`${formatValue(hassle)}v: hassle`)
                            }
                            more.append('hr')
                                .style('width', '2em')
                                .style('margin', 0)

                            const ratio = recipeItem.value / sum
                            more.append("div")
                                .text(`${formatValue(sum)}v (${formatValue(ratio * 100)}%, ${ratio > 1 ? '+' : ''}${formatValue(recipeItem.value - sum)}v)`)
                                .style('color', ratio > 1.1 ? '#008400' : ratio < 0.9 ? '#840000' : '')

                            const summary = details.append('summary')
                            summary.append("span")
                                .text(`${formatValue(recipeItem.value)}v: `)
                            summary.append("a")
                                .attr("href", `#${recipeItem.id}`)
                                .text(recipeItem.title ?? recipeItem.id)
                            summary.append("span")
                                .text(` (${formatValue(ratio * 100)}%, ${ratio > 1 ? '+' : ''}${formatValue(currentItemTG.value * (ratio - 1))}v)`)
                            summary
                                .style('color', ratio > 1.1 ? '#008400' : ratio < 0.9 ? '#840000' : '')

                            return [ratio, details] as [number, d3.Selection<HTMLDetailsElement, undefined, null, undefined>]
                        })
                })
                .sort((a, b) => b[0] - a[0])

            for(const [_, output] of outputs) {
                info.node()!.append(output.node()!)
            }

        } else {
            info.append('span').append('em')
                .text('Nothing')
        }

        info.append('hr')
            .style('margin', '1em 0em')

        if(recipe && recipe.fabricate.length > 0) {
            for(const fab of recipe.fabricate) {
                info.append("h3")
                    .text(`Fabricate from ${fab.skill ? `(${fab.skill.id}: ${fab.skill.level}+)` : ''} ${fab.talent ? '#talent' : ''}`)
                const producedAmount = fab.amount
                let sum = 0
                for(const [id, amount] of Object.entries(fab.parts)) {
                    const item = ITEMS.find((item) => item.id === id)!
                    sum += amount/producedAmount * item.value
                    info.append("div")
                        .call(addSubLine, item, amount/producedAmount)
                }
                if(hassle) {
                    sum += hassle
                    info.append("div")
                        .text(`${formatValue(hassle)}v: hassle`)
                }
                info.append('hr')
                    .style('width', '2em')
                    .style('margin', 0)

                const ratio = currentItemTG.value / sum
                info.append("div")
                    .text(`${formatValue(sum)}v (${formatValue(ratio * 100)}%, ${ratio > 1 ? '+' : ''}${formatValue((currentItemTG.value - sum))}v)`)
                    .style('color', ratio > 1.1 ? '#008400' : ratio < 0.9 ? '#840000' : '')
            }
        } else {
            info.append('span').append('em')
                .text('Nothing')
        }

        const deconstructsFromNode = info.append('div')
            .style('margin-top', '1em')
        deconstructsFromNode.append("h3")
            .text(`Deconstruct from`)
        const deconstructsFrom = RECIPES.filter((recipe) => Object.keys(recipe.deconstruct?.parts ?? {}).some((partId) => partId === currentItemTG.id))
        if(deconstructsFrom.length) {
            const ul = deconstructsFromNode.append('ul')

            for(const recipe of deconstructsFrom) {
                const recipeItem = ITEMS.find((item) => item.id === recipe.result)!
                ul.append('li')
                    .text(recipeItem.title)
            }
        } else {
            info.append('span').append('em')
                .text('Nothing')
        }



        // info.append("h3")
        //     .text(`Debug`)

        // info.append("pre")
        //     .text(JSON.stringify(Object.getPrototypeOf(d), undefined, 2))

        // info.append("pre")
        //     .text(JSON.stringify(d, undefined, 2))

    }
    const callInfo = (event?: any, d?: DisplayNode) => {
        if(d) currentItem = Object.getPrototypeOf(d) as ItemFE
        console.log(currentItem)
        document.location.hash = currentItem?.id ?? ''
        refreshInfo()
    }
    const onHashChange = () => {
        currentItem = ITEMS.find((item) => item.id === document.location.hash.slice(1)) ?? null
        refreshInfo()
    }
    onHashChange()
    window.addEventListener('hashchange', onHashChange)

    const resetValues = () => {
        const hassle = Number((document.getElementById('hassle') as HTMLInputElement).value)
        for(const item of ITEMS) {
            const consume = localStorage.getItem(`consume-${item.id}`) !== null
            item.baseValue = consume ? item.price : item.price / 4
            item.value = item.baseValue
            item._nextValue = item.baseValue
            item.suggestion = consume ? Suggestion.Consume : item.price > hassle ? Suggestion.Sell : Suggestion.Trash
        }
        refreshInfo()
    }
    const simulateValues = (n = 1) => {
        const hassle = Number((document.getElementById('hassle') as HTMLInputElement).value)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for(let i = 0; i < n; i++) {
            for(const item of ITEMS) {
                const consume = localStorage.getItem(`consume-${item.id}`) !== null
                let bestValue = item.baseValue

                const recipe = RECIPES.find((recipe) => recipe.result === item.id)
                if(recipe?.deconstruct) {
                    let deconstructValue = 0
                    for(const [id, amount] of Object.entries(recipe.deconstruct.parts)) {
                        const partItem = ITEMS.find((item) => item.id === id)
                        if(!partItem && !id.includes('genetic')) {
                            console.warn(`Missing definition for item with id "${id}" for "${item.id}", skipping..`)
                            continue
                        }
                        deconstructValue += amount * (partItem?.value ?? 0)
                        // deconstructValue += amount * Math.min(partItem?.value ?? 0, partItem?.price ?? 0)
                    }
                    deconstructValue -= hassle

                    if(bestValue < deconstructValue) {
                        bestValue = deconstructValue
                        item.suggestion = Suggestion.Deconstruct
                    }
                }

                for(const recipe of RECIPES) {
                    for(const fab of recipe.fabricate) {
                        const myAmount = Object.entries(fab.parts).find(([partId]) => partId === item.id)?.[1]
                        if(!myAmount) continue  // I'm not in this recipe.
                        const producedAmount = fab.amount

                        const recipeItem = ITEMS.find((item) => item.id === recipe.result)
                        if(!recipeItem) {
                            console.warn(`Missing item "${recipe.result}" for fabrication result, skipping..`)  // impossible?
                            continue
                        }

                        let sumValue = 0
                        let sumOrdinariness = 0
                        for(const [id, partAmount] of Object.entries(fab.parts)) {
                            const partItem = ITEMS.find((item) => item.id === id)
                            if(!partItem) {
                                console.warn(`Missing item "${id}" for fabricating "${recipeItem.id}", skipping..`)
                                continue
                            }
                            sumValue += partAmount/producedAmount * partItem.value
                            sumOrdinariness += partAmount/producedAmount * partItem.rarity
                            // sumValue += partAmount/producedAmount * Math.min(partItem.value ?? 0, partItem.price ?? 0)

                        }
                        sumValue += hassle

                        const fabricationValue = (item.value || 0) + (recipeItem.value - sumValue) * (item.rarity / sumOrdinariness)
                        if(bestValue < fabricationValue) {
                            bestValue = fabricationValue
                            item.suggestion = Suggestion.Fabricate
                        }
                    }
                }

                item._nextValue = bestValue
            }
            for(const item of ITEMS) {
                const koef = .33
                item.value = koef * item._nextValue + (1 - koef) * item.value
                item.fy = TOTAL_HEIGHT - priceToHeight(1400 * (item.value / item.price - 0.25) * (1/0.75))
                if(item.value < hassle) {
                    item.suggestion = Suggestion.Trash
                }

                if(item.value <= hassle) item.shopSuggestion = ShopSuggestion.Trash
                else if(item.value <= item.price / 4) item.shopSuggestion = ShopSuggestion.Sell
                else if(item.value <= item.price / 2) item.shopSuggestion = ShopSuggestion.SellPremium
                else if(item.value >= item.price && item.rarity < 100) item.shopSuggestion = ShopSuggestion.Buy
                else if(item.value >= item.price / 2 && item.rarity < 100) item.shopSuggestion = ShopSuggestion.BuyDiscounted
                else item.shopSuggestion = ShopSuggestion.Hold
            }
        }

        // simulation.restart()
        refreshInfo()

        const suggestionNodes = Object.values(Suggestion).map((suggestion) => ({
            label: suggestion,
            amount: ITEMS.filter((item) => item.suggestion === suggestion).length,
        })).concat({label: '' as Suggestion, amount: Infinity})
            .sort((a, b) => b.amount - a.amount)
        const $suggestion = d3.select('#suggestion')
            .selectAll('option')
            .data(suggestionNodes)
        $suggestion.enter()
            .append('option')
            .attr('value', d => d.label)
            .text(d => d.label ? `${d.label} (${d.amount})` : '')
        $suggestion
            .text(d => d.label ? `${d.label} (${d.amount})` : '')

        const shoppingNodes = Object.values(ShopSuggestion).map((shopping) => ({
            label: shopping,
            amount: ITEMS.filter((item) => item.shopSuggestion === shopping).length,
        })).concat({label: '' as ShopSuggestion, amount: Infinity})
            .sort((a, b) => (a.label as string) === '' ? -1 : (b.label as string) === '' ? 1 : 0)
        const $shopping = d3.select('#shopping')
            .selectAll('option')
            .data(shoppingNodes)
        $shopping.enter()
            .append('option')
            .attr('value', d => d.label)
            .text(d => d.label ? `${d.label} (${d.amount})` : '')
        $shopping
            .text(d => d.label ? `${d.label} (${d.amount})` : '')
    }

    function linkArc(d: { source: DisplayNode; target: DisplayNode }) {
        return `M ${d.source.x} ${d.source.y} Q ${d.source.x ?? 0} ${d.target.y ?? 0}, ${d.target.x} ${d.target.y}`;
    }

    const itemNodes: DisplayNode[] = ITEMS.map(d => Object.create(d));
    const simulation: d3.Simulation<DisplayNode, DisplayLink> = d3.forceSimulation([...itemNodes])
        .alphaDecay(0.01)  // default is 0.0228\
        .velocityDecay(0.2)  // default is 0.4
    const chart = () => {
        // const categoryNodes: DisplayNode[] = CATEGORIES.map(d => Object.create({id: d, fy: TOTAL_HEIGHT - priceToHeight(0, true), type: 'category'}));
        // const orphanNode: DisplayNode = Object.create(CATEGORY_ORPHAN)

        const itemLinks = ITEM_LINKS
            .map<DisplayLink>(d => ({
                type: 'item',
                source: itemNodes.find((item) => item.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!,
            }))
            .filter(d => d.source && d.target);

        // const orphanLinks = ORPHAN_LINKS
        //     .map<DisplayLink>(d => ({
        //         type: 'orphan',
        //         source: orphanNode,
        //         target: itemNodes.find((item) => item.id === d.target)!,
        //     }))
        //     .filter(d => d.source && d.target);
        // console.log(ORPHAN_LINKS)

        // const categoryLinks = CATEGORY_LINKS
        //     .map<DisplayLink>(d => ({
        //         type: 'category',
        //         source: categoryNodes.find((item) => item.id === d.source)!,
        //         target: itemNodes.find((item) => item.id === d.target)!
        //     }))
        //     .filter(d => d.source && d.target);

        const forceLink = d3.forceLink<DisplayNode, DisplayLink>([...itemLinks])
            .distance((link) => Math.max(iconSize * 1.5, Math.abs(link.source.fy! - link.target.fy!)))
            .strength((link) => 1 / Math.min(nodeLinkCountMap.get(link.source.id) || 1, nodeLinkCountMap.get(link.target.id) || 1) * (link.source.group && link.source.group === link.target.group ? 1 : 0.5))
            // .strength((link) => 1 / Math.sqrt(Math.max(nodeLinkCountMap.get(link.source.id) || 1, nodeLinkCountMap.get(link.target.id) || 1)))
        const forceCollision = d3.forceCollide(iconSize/2 * 1.5)
        // .strength(.99)
        // const forceX = d3.forceX()
        //     .strength(0.00001)

        simulation
            .force("link", forceLink)
            .force("collision", forceCollision)
            // .force("x", forceX)
            // .force("x-orphan", d3.forceX<DisplayNode>(900).strength((item) => (nodeLinkCountMap.get(item.id) ?? 0) === 0 ? 0.1 : 0))
            // .force("charge", d3.forceManyBody<DisplayNode>().strength(-800).distanceMax(iconSize * 100))
            // .force("centering", d3.forceCenter(0, TOTAL_HEIGHT/2).strength(0.5))
            // .force("y", d3.forceY());

        for(const group of groups) {
            simulation
                .force(`x-${group.id}`, d3.forceX<DisplayNode>(group.x).strength((item) => item.group === group.id ? 0.5 : 0))
        }

        const svg = d3.create('svg')
            .style("min-width", "110%")
            .style("font", "12px sans-serif")

        // Per-type markers, as they don't inherit styles.
        // svg.append("defs").selectAll("marker")
        //     .data(categories)
        //     .join("marker")
        //     .attr("id", d => `arrow-${d}`)
        //     .attr("viewBox", "0 -5 10 10")
        //     .attr("refX", 15)
        //     .attr("refY", -0.5)
        //     .attr("markerWidth", 6)
        //     .attr("markerHeight", 6)
        //     .attr("orient", "auto")
        //     .append("path")
        //     .attr("fill", d => color(d.type))
        //     .attr("d", "M0,-5L10,0L0,5");

        const link = svg.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(itemLinks)
            .join("path")
            .attr("stroke-width", 1)
            .attr("stroke", d => linkColor(d.target.id))
            // .attr("marker-end", d => `url(${new URL(`#arrow-${d.target.id}`)})`);

        const dashboardContainer = svg.append('g')
            .attr("transform", `translate(0, ${TOTAL_HEIGHT - priceToHeight(1) + iconSize})`)
        const dashboard = {
            alpha: dashboardContainer.append('text')
                .attr('text-anchor', 'middle')
        }

        const GROUP_WIDTH = 400
        for(const group of groups) {
            const groupContainer = svg.append('g')
                .attr("transform", `translate(${group.x}, 0)`)

            groupContainer.append('rect')
                .attr("x", -GROUP_WIDTH/2)
                .attr("y", -iconSize)
                .attr("width", GROUP_WIDTH)
                .attr("height", TOTAL_HEIGHT - priceToHeight(1) + iconSize * 2)
                .attr("fill", `${linkColor(group.id)}40`)

            groupContainer.append('text')
                .attr("y", -iconSize/2)
                .attr('text-anchor', 'middle')
                .text(group.id)
        }

        const containerSvg = svg.append("g")
            .attr("fill", "currentColor")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")


        const itemSvg = containerSvg
            .selectAll<SVGGElement, never>("g.item")
            .data([...itemNodes])
            .join("g")
            .classed('item', true)
            .call(drag(simulation))
            .on('click', callInfo)

        itemSvg
            .append("rect")
            .attr("x", -iconSize/2 - strokeWidth/4)
            .attr("y", -iconSize/2 - strokeWidth/4)
            .attr("width", iconSize + strokeWidth/2)
            .attr("height", iconSize + strokeWidth/2)
            .attr("fill", "#bbb")
            .attr("stroke", d => linkColor(d.group ?? 'Other'))
            .attr("stroke-width", strokeWidth);

        itemSvg
            .append("image")
            .attr("href", (d) => d.icon?.path ? `img/${d.icon?.path}` : null)
            .attr("clip-path", (d) => {
                const rect = d.icon?.rect
                if(!rect) return null
                return `path('M 0 0 h ${rect[2]} v ${rect[3]} h -${rect[2]} v -${rect[3]}')`
            })
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("x", (d) => d.icon ? -d.icon.rect[0] : null)
            .attr("y", (d) => d.icon ? -d.icon.rect[1] : null)
            .attr("transform", (d) => d.icon ? `translate(-${iconSize/2} -${iconSize/2}) scale(${iconSize / Math.max(d.icon?.rect[2], d.icon?.rect[3])})` : null)

        // the default phyllotaxis arrangement is centered on <0,0> with a distance between nodes of ~10 pixels
        // once the arrangement is initialized, scale and translate it
        // https://observablehq.com/@d3/force-layout-phyllotaxis
        for (const node of [...itemNodes]) {
            if(node.group) {
                node.x = groups.find((group) => group.id === node.group)?.x
            } else {
                node.x = node.x! / 10 * iconSize * 2;
            }
        }
        // Initial positions for nicier ordering\
        // orphanNode.x = 1900


        itemNodes.find((item) => item.id === 'tin')!.x = -1400
        itemNodes.find((item) => item.id === 'fpgacircuit')!.x = -1400
        itemNodes.filter((item) => item.id.includes('component')).forEach((item) => item.x = -1400)


        let stickyMinX = 0
        let stickyMaxX = 0
        let minXItemCache: DisplayNode
        let maxXItemCache: DisplayNode
        minXItemCache = itemNodes.reduce((min, node) => (min.x ?? 0) < (node.x ?? 0) ? min : node, itemNodes[0])
        maxXItemCache = itemNodes.reduce((max, node) => (max.x ?? 0) < (node.x ?? 0) ? max : node, itemNodes[0])
        simulation.on("tick", () => {
            link.attr("d", linkArc);
            itemSvg.attr("transform", d => `translate(${d.x},${d.y})`);

            if(simulation.alpha() < 0.5 && !simulation.force('collision')) {
                simulation.force('collision', forceCollision)
            }
            if(simulation.alpha() > 0.5 && simulation.force('collision')) {
                simulation.force('collision', null)
            }

            if(Math.random() < 0.05) {
                minXItemCache = itemNodes.reduce((min, node) => (min.x ?? 0) < (node.x ?? 0) ? min : node, itemNodes[0])
                maxXItemCache = itemNodes.reduce((max, node) => (max.x ?? 0) > (node.x ?? 0) ? max : node, itemNodes[0])
            }
            stickyMinX = Math.min(stickyMinX, Math.floor((minXItemCache.x ?? 0 - iconSize) / 500) * 500 - 250)
            stickyMaxX = Math.max(stickyMaxX, Math.ceil((maxXItemCache.x ?? 0 + iconSize) / 500) * 500 + 250)
            const viewbox = [
                stickyMinX,
                -iconSize,
                stickyMaxX - stickyMinX,
                TOTAL_HEIGHT - priceToHeight(1) + 2 * iconSize,
            ]

            dashboard.alpha.text(simulation.alpha())

            svg
                .attr("viewBox", viewbox)
                .attr("width", viewbox[2])
                .attr("height", viewbox[3])
        });

        // invalidation.then(() => simulation.stop());

        return svg;
    }

    const tableNodes = ITEMS.map(d => Object.create(d));

    function onTable() {
        const filterCategory = (document.getElementById('category') as HTMLSelectElement).value.split(' (')[0]
        const filterSuggestion = (document.getElementById('suggestion') as HTMLSelectElement).value.split(' (')[0]
        const filterShopping = (document.getElementById('shopping') as HTMLSelectElement).value.split(' (')[0]
        const isVisible = (item: ItemFE) => (filterCategory ? item.categories.includes(filterCategory) : true)
            && (filterSuggestion ? item.suggestion === filterSuggestion : true)
            && (filterShopping ? item.shopSuggestion === filterShopping : true)

        const tbody = d3.select('#table > tbody')
        const rows = tbody
            .selectAll('tr')
            .data<ItemFE>(tableNodes, (d: unknown) => (d as any).id)

        const enterRow = rows.enter()
            .append('tr')

        enterRow
            .append('td')
            .classed('value', true)

        enterRow
            .append('td')
            .classed('price', true)

        enterRow
            .append('td')
            .append('svg')
            .attr('width', '36px')
            .attr('height', '36px')
            .classed('icon', true)
            .append('image')

        enterRow
            .append('td')
            .append('a')
            .classed('id', true)

        enterRow
            .append('td')
            .append('span')
            .classed('suggestion', true)

        enterRow
            .append('td')
            .append('span')
            .classed('shopSuggestion', true)

        enterRow
            .append('td')
            .append('input')
            .attr('type', 'checkbox')
            .classed('consume', true)
            .attr('checked', (d) => localStorage.getItem(`consume-${d.id}`) !== null ? true : null)


        const updateRows = rows
            .sort((a, b) => b.value - a.value)
            .style('background-color', (d) => tableRowColor(d.value).replace('(', 'a(').replace(')', ', 0.5)'))
            .style('display', (d) => isVisible(d) ? null : 'none')

        const cellValue = updateRows
            .select('td.value')
            .datum(d => d.value)
            .text(d => `${format0(d ?? 0)}`)

        const cellPrice = updateRows
            .select('td.price')
            .datum(d => d.price)
            .text(d => `${format0(d ?? 0)}`)

        const cellId = updateRows
            .select('td > a.id')
            .datum(d => d.id)
            .attr('href', d => `#${d}`)
            .text(d => `${d}`)

        const cellSuggestion = updateRows
            .select('td > span.suggestion')
            .datum(d => d)
            .attr('title', d => `${format0(d.value/d.price * 100)}%`)
            .text(d => `${d.suggestion}`)

        const cellShopSuggestion = updateRows
            .select('td > span.shopSuggestion')
            .datum(d => d)
            // .attr('title', d => `${format0(d.value/d.price * 100)}%`)
            .text(d => `${d.shopSuggestion}`)

        const cellIcon = updateRows
            .select('td > svg.icon > image')
            .datum(d => d.icon)
            .attr("href", d => d?.path ? `img/${d?.path}` : null)
            .attr("clip-path", d => d.rect ? `path('M 0 0 h ${d.rect[2]} v ${d.rect[3]} h -${d.rect[2]} v -${d.rect[3]}')` : null)
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("x", d => -d?.rect[0])
            .attr("y", d => -d?.rect[1])
            .attr("transform", d => `scale(${iconSize * 1 / Math.max(d?.rect[2], d?.rect[3])})`)

        const cellConsume = updateRows
            .select('td > input.consume')
            .datum(d => d.id)
            .attr('id', id => `consume-${id}`)
            .on('click', (event: MouseEvent) => {
                const id = (event.target as any).id as string
                if(localStorage.getItem(id)) {
                    localStorage.removeItem(id)
                } else {
                    localStorage.setItem(id, "checked")
                }
                onHassleChange()
            })

        // const updateCell = updateRow
        //     .data((d) => [
        //         {text: },
        //         {text: `${Math.round(d.price ?? 0)}`},
        //         {text: d.id, href: `#${d.id}`},
        //     ])
        //     .text((d) => d.text)
        //     .attr('href', (d) => d.href ?? '')

        console.log(ITEMS)

    }

    const onHassleChange = () => {
        resetValues()
        simulateValues(20)
        onTable()
    }
    document.getElementById('hassle')!.addEventListener('click', onHassleChange)
    ;(window as any).resetValues = resetValues
    ;(window as any).simulateValues = simulateValues
    ;(window as any).onTable = onTable

    // document.getElementById('chart')?.append(chart().node()!)
    onTable()
    onHassleChange()


    const categoryNodes = CATEGORIES.map((category) => ({
        label: category,
        amount: ITEMS.filter((item) => item.categories.includes(category)).length,
    })).concat({label: '', amount: Infinity})
        .filter(({amount}) => amount > 1)
        .sort((a, b) => b.amount - a.amount)
    d3.select('#category')
        .selectAll('option')
        .data(categoryNodes)
        .enter()
        .append('option')
        .attr('value', d => d.label)
        .text(d => d.label ? `${d.label} (${d.amount})` : '')

    ;(document.getElementById('category') as HTMLSelectElement)!.addEventListener('change', () => onTable())
    ;(document.getElementById('suggestion') as HTMLSelectElement)!.addEventListener('change', () => onTable())
    ;(document.getElementById('shopping') as HTMLSelectElement)!.addEventListener('change', () => onTable())


})().catch((err) => console.error(err))
