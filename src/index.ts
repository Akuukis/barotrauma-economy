/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="d3" />
/// <reference path="./common.ts" />
// import d3 from 'd3'
// import { Item, Recipe } from './common'

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

(async () => {
    const iconSize = 36
    const strokeWidth = 4
    const priceToHeight = (price: number, category = false) => Math.max(category ? 1 : 2, Math.log2(price)) * 140
    const nodeLinkCountMap = new Map<IdItemString, number>()

    const RECIPES = (await (await fetch('./recipes.json')).json() as Recipe[])
    const ITEMS_RAW = (await (await fetch('./items.json')).json() as Item[])
    const ITEM_LINKS = RECIPES.flatMap((recipe) => recipe.parts.map((part) => ({source: part.id, target: recipe.result})))
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
    const andComponent = ITEMS_RAW.find((innerItem) => innerItem.id === 'andcomponent')!
    const ITEMS = ITEMS_RAW
        .map((item) => ({
            ...item,
            fy: TOTAL_HEIGHT - priceToHeight(item.price),
            group: groups.find((group) => group.member(item))?.id,
        }))
        .filter((item) => !item.id.endsWith('wire') || item.id === 'wire')
        .filter((item) => !item.id.endsWith('component'))
        .concat({
            ...andComponent,
            title: 'Wiring Component',
            fy: TOTAL_HEIGHT - priceToHeight(andComponent.price),
            group: groups.find((group) => group.member(andComponent))?.id,
        })
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
            if (!event.active) simulation.alpha(Math.max(0.01, simulation.alpha())).alphaDecay(0).restart();
            d.fx = d.fx ?? d.x;
            d.fy = d.fy ?? d.y;
        }

        function dragged(event: any, d: DisplayNode) {
            d.fx = Object.getPrototypeOf(d).fx ?? event.x;
            d.fy = Object.getPrototypeOf(d).fy ?? event.y;
        }

        function dragended(event: any, d: DisplayNode) {
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

    const callInfo = (event: any, d: DisplayNode) => {
        const item = Object.getPrototypeOf(d) as Item
        const info = d3.select('#info')

        info.selectAll('*').remove()

        const rect = d.icon?.rect
        const svg = info.append('svg')
            .attr("width", iconSize * 2 + strokeWidth/2)
            .attr("height", iconSize * 2 + strokeWidth/2)
            .style('float', 'left')
            .style('margin-right', '1em')

        svg
            .append("rect")
            .attr("width", iconSize * 2 + strokeWidth/2)
            .attr("height", iconSize * 2 + strokeWidth/2)
            .attr("fill", "#bbb")
            .attr("stroke", linkColor(d.group ?? 'Other'))
            .attr("stroke-width", strokeWidth);
        svg
            .append("image")
            .attr("href", d.icon?.path ? `img/${d.icon?.path}` : null)
            .attr("clip-path", rect ? `path('M 0 0 h ${rect[2]} v ${rect[3]} h -${rect[2]} v -${rect[3]}')` : null)
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("x", d.icon ? -d.icon.rect[0] : null)
            .attr("y", d.icon ? -d.icon.rect[1] : null)
            .attr("transform", d.icon ? `scale(${iconSize * 2 / Math.max(d.icon?.rect[2], d.icon?.rect[3])})` : null)

        const infobox = info.append("div")

        infobox.append("h3")
            .text(`${item.title}`)
            .style('margin-bottom', 0)

        infobox.append("div")
            .text(`ID: ${item.id}`)
        infobox.append("div")
            .text(`Base price: ${item.price}`)


        const recipe = RECIPES.find((recipe) => recipe.result === item.id)
        if(recipe) {
            if(recipe.parts.some((part) => part.output > 0)) {
                info.append("h3")
                    .text(`Deconstruct`)
                let sum = 0
                for(const part of recipe.parts) {
                    if(part.output === 0) continue
                    const partItem = ITEMS.find((item) => item.id === part.id)!
                    sum += part.output * partItem.price
                    info.append("div")
                        .text(`${part.output * partItem.price}: ${part.output} x ${part.id} (${partItem.price})`)
                }
                info.append('hr')
                    .style('width', '2em')
                    .style('margin-left', 0)

                const ratio = sum / item.price
                info.append("div")
                    .text(`${sum} (${Math.round(ratio * 100)}%, ${ratio > 1 ? '+' : ''}${sum - item.price})`)
                    .style('color', ratio > 1.1 ? '#008400' : ratio < 0.9 ? '#840000' : '')
            }
            if(recipe.parts.some((part) => part.input > 0)) {
                info.append("h3")
                    .text(`Fabricate`)
                let sum = 0
                for(const part of recipe.parts) {
                    if(part.input === 0) continue
                    const partItem = ITEMS.find((item) => item.id === part.id)!
                    sum += part.input * partItem.price
                    info.append("div")
                        .text(`${part.input * partItem.price}: ${part.input} x ${part.id} (${partItem.price})`)
                }
                info.append('hr')
                    .style('width', '2em')
                    .style('margin-left', 0)

                const ratio = item.price / sum
                info.append("div")
                    .text(`${sum} (${Math.round(ratio * 100)}%, ${ratio > 1 ? '+' : ''}${item.price - sum})`)
                    .style('color', ratio > 1.1 ? '#008400' : ratio < 0.9 ? '#840000' : '')
            }
        }


        info.append("h3")
            .text(`Debug`)

        info.append("pre")
            .text(JSON.stringify(Object.getPrototypeOf(d), undefined, 2))

        info.append("pre")
            .text(JSON.stringify(d, undefined, 2))

    }

    function linkArc(d: { source: DisplayNode; target: DisplayNode }) {
        return `M ${d.source.x} ${d.source.y} Q ${d.source.x ?? 0} ${d.target.y ?? 0}, ${d.target.x} ${d.target.y}`;
    }

    const chart = () => {
        const itemNodes: DisplayNode[] = ITEMS.map(d => Object.create(d));
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

        const simulation: d3.Simulation<DisplayNode, DisplayLink> = d3.forceSimulation([...itemNodes])
            .alphaDecay(0.01)  // default is 0.0228\
            .velocityDecay(0.2)  // default is 0.4
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

    document.getElementById('chart')?.append(chart().node()!)

})().catch((err) => console.error(err))
