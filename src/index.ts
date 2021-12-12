/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="d3" />
/// <reference path="./common.ts" />
// import d3 from 'd3'
// import { Item, Recipe } from './common'

interface DisplayNode extends d3.SimulationNodeDatum {
    id: string
    type: 'item' | 'category'
    icon?: Item['icon']
    categories?: IdCategoryString[]
}
interface DisplayLink extends d3.SimulationNodeDatum {
    type: 'item' | 'item' | 'category' | 'orphan'
    source: DisplayNode
    target: DisplayNode
}

(async () => {

    const iconSize = 36
    const strokeWidth = 4
    const priceToHeight = (price: number, category = false) => Math.max(category ? 1 : 2, Math.log2(price)) * 140

    const ITEMS_RAW = (await (await fetch('./items.json')).json() as Item[])
    const TOTAL_HEIGHT = ITEMS_RAW.reduce((max, item) => Math.max(max, priceToHeight(item.price)), 0)

    const ITEMS = ITEMS_RAW
        .map((item) => ({
            ...item,
            fy: TOTAL_HEIGHT - priceToHeight(item.price)
        }))
    const RECIPES = (await (await fetch('./recipes.json')).json() as Recipe[])
    const CATEGORIES = Array.from(new Set(ITEMS_RAW.flatMap(d => d.categories)))

    // Debug
    // ITEMS.splice(20)
    // RECIPES.splice(20)
    // CATEGORIES.splice(20)
    console.log(ITEMS)
    console.log(RECIPES)
    console.log(CATEGORIES)

    const ITEM_LINKS = RECIPES.flatMap((recipe) => recipe.parts.map((part) => ({source: part.id, target: recipe.result})))
    const CATEGORY_LINKS = ITEMS_RAW.flatMap((item) => item.categories.map((category) => ({source: category, target: item.id})))

    const CATEGORY_ORPHAN: DisplayNode = {id: 'orphan', type: 'category', fy: TOTAL_HEIGHT / 2}
    const nodeLinkCountMap = new Map<IdItemString, number>([...ITEMS, CATEGORY_ORPHAN].map((item) => [item.id, 0]))
    for(const itemLink of ITEM_LINKS) {
        nodeLinkCountMap.set(itemLink.source, (nodeLinkCountMap.get(itemLink.source) ?? 0) + 1)
        nodeLinkCountMap.set(itemLink.target, (nodeLinkCountMap.get(itemLink.target) ?? 0) + 1)
    }
    const ORPHAN_LINKS = [...nodeLinkCountMap.entries()]
        .filter(([_, count]) => count === 0)
        .map(([itemId, _]) => ({source: 'orphan', target: itemId}))
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
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.fx ?? d.x;
            d.fy = d.fy ?? d.y;
        }

        function dragged(event: any, d: DisplayNode) {
            d.fx = Object.getPrototypeOf(d).fx ?? event.x;
            d.fy = Object.getPrototypeOf(d).fy ?? event.y;
        }

        function dragended(event: any, d: DisplayNode) {
            if (!event.active) simulation.alphaTarget(0);
            delete d.fx;  // if fy is set then it's on prototype up, so just delete it here.
            delete d.fy;  // if fy is set then it's on prototype up, so just delete it here.
        }

        return d3.drag<SVGGElement, DisplayNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    const linkColor = d3.scaleOrdinal(CATEGORIES, d3.schemeCategory10)

    function linkArc(d: { source: DisplayNode; target: DisplayNode }) {
        return `M ${d.source.x} ${d.source.y} Q ${d.source.x ?? 0} ${d.target.y ?? 0}, ${d.target.x} ${d.target.y}`;
    }

    const chart = () => {
        const itemNodes: DisplayNode[] = ITEMS.map(d => Object.create(d));
        const categoryNodes: DisplayNode[] = CATEGORIES.map(d => Object.create({id: d, fy: TOTAL_HEIGHT - priceToHeight(0, true), type: 'category'}));
        const orphanNode: DisplayNode = Object.create(CATEGORY_ORPHAN)

        const itemLinks = ITEM_LINKS
            .map<DisplayLink>(d => ({
                type: 'item',
                source: itemNodes.find((item) => item.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!,
            }))
            .filter(d => d.source && d.target);

        const orphanLinks = ORPHAN_LINKS
            .map<DisplayLink>(d => ({
                type: 'orphan',
                source: orphanNode,
                target: itemNodes.find((item) => item.id === d.target)!,
            }))
            .filter(d => d.source && d.target);
        console.log(ORPHAN_LINKS)

        const categoryLinks = CATEGORY_LINKS
            .map<DisplayLink>(d => ({
                type: 'category',
                source: categoryNodes.find((item) => item.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!
            }))
            .filter(d => d.source && d.target);

        const forceLink = d3.forceLink<DisplayNode, DisplayLink>([...itemLinks, ...orphanLinks])
            .distance((link) => Math.max(iconSize * 1.5 + Math.abs(link.source.fy! - link.target.fy!)))
            .strength((link) => 1 / Math.sqrt(Math.max(nodeLinkCountMap.get(link.source.id) || 1, nodeLinkCountMap.get(link.target.id) || 1)))
        const forceCollision = d3.forceCollide(iconSize/2 * 1)
            .strength(.95)
        const forceX = d3.forceX()
            .strength(0.00001)

        const simulation: d3.Simulation<DisplayNode, DisplayLink> = d3.forceSimulation([...itemNodes, orphanNode])
            .alphaDecay(0.01)  // default is 0.0228
            .force("link", forceLink)
            .force("collision", forceCollision)
            .force("x", forceX)
            // .force("charge", d3.forceManyBody<DisplayNode>().strength(-800).distanceMax(iconSize * 100))
            // .force("centering", d3.forceCenter(0, TOTAL_HEIGHT/2).strength(0.5))
            // .force("y", d3.forceY());

        const svg = d3.select('body').append("svg")
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
            .attr("stroke-width", 1.5)
            .attr("stroke", d => linkColor(d.target.id.replace('recipe-', '')))
            // .attr("marker-end", d => `url(${new URL(`#arrow-${d.target.id}`)})`);

        const containerSvg = svg.append("g")
            .attr("fill", "currentColor")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")


        const itemSvg = containerSvg
            .selectAll<SVGGElement, never>("g.item")
            .data([...itemNodes, orphanNode])
            .join("g")
            .classed('item', true)
            .call(drag(simulation))

        itemSvg
            .append("rect")
            .attr("x", -iconSize/2 - strokeWidth/4)
            .attr("y", -iconSize/2 - strokeWidth/4)
            .attr("width", iconSize + strokeWidth/2)
            .attr("height", iconSize + strokeWidth/2)
            .attr("fill", "#bbb")
            .attr("stroke", d => linkColor(d.categories?.[0] ?? 'recipe'))
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

        itemSvg.append("text")
            .attr("x", 4)
            .attr("y", "0.31em")
            .attr("transform", "translate(0, 0) rotate(-45)")
            .text(d => d.id)
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 3);

        // the default phyllotaxis arrangement is centered on <0,0> with a distance between nodes of ~10 pixels
        // once the arrangement is initialized, scale and translate it
        // https://observablehq.com/@d3/force-layout-phyllotaxis
        for (const node of [...itemNodes, orphanNode]) {
            node.x = node.x! / 10 * iconSize * 2;
        }
        // Initial positions for nicier ordering\
        orphanNode.x = 1400
        itemNodes.find((item) => item.id === 'tin')!.x = -1400


        let stickyWidth = 0
        let minXItemCache: DisplayNode
        let maxXItemCache: DisplayNode
        minXItemCache = itemNodes.reduce((min, node) => (min.x ?? 0) < (node.x ?? 0) ? min : node, itemNodes[0])
        maxXItemCache = itemNodes.reduce((max, node) => (max.x ?? 0) < (node.x ?? 0) ? max : node, itemNodes[0])
        simulation.on("tick", () => {
            link.attr("d", linkArc);
            itemSvg.attr("transform", d => `translate(${d.x},${d.y})`);

            // if(simulation.alpha() < 0.5) {
            //     simulation.force('collision', forceCollision)
            // }

            if(Math.random() < 0.05) {
                minXItemCache = itemNodes.reduce((min, node) => (min.x ?? 0) < (node.x ?? 0) ? min : node, itemNodes[0])
                maxXItemCache = itemNodes.reduce((max, node) => (max.x ?? 0) > (node.x ?? 0) ? max : node, itemNodes[0])
            }
            const minX = minXItemCache.x ?? 0 - iconSize
            const maxX = maxXItemCache.x ?? 0 + iconSize
            const viewbox = [
                minX,
                -iconSize,
                maxX - minX,
                TOTAL_HEIGHT - priceToHeight(1) + 2 * iconSize,
            ]

            svg
                .attr("viewBox", viewbox)
                .attr("width", stickyWidth = Math.max(stickyWidth, Math.ceil(viewbox[2] / 1000) * 1000))
                .attr("height", viewbox[3])
        });

        // invalidation.then(() => simulation.stop());

        return svg.node();
    }

    chart()

})().catch((err) => console.error(err))
