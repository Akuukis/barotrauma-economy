/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="d3" />
/// <reference path="./common.ts" />
// import d3 from 'd3'
// import { Item, Recipe } from './common'

interface DisplayNode extends d3.SimulationNodeDatum {
    id: string
    type: 'item' | 'recipe' | 'category'
}
interface DisplayLink extends d3.SimulationNodeDatum {
    type: 'item' | 'category'
    source: DisplayNode
    target: DisplayNode
}

(async () => {
    const priceToHeight = (price: number, category = false) => Math.max(category ? 1 : 2, Math.log2(price)) * 100

    const recipes = (await (await fetch('./recipes.json')).json() as Recipe[])
    const items = (await (await fetch('./items.json')).json() as Item[])

    const height = items.reduce((max, item) => Math.max(max, priceToHeight(item.price)), 0)

    const itemsOnce = (await (await fetch('./items.json')).json() as Item[])
        .map((item) => ({
            ...item,
            fy: height - priceToHeight(item.price)
        }))

    const itemLinksOnce = recipes.flatMap((recipe) => recipe.parts.filter((part) => part.input > 0).map((part) => ({source: part.id, target: recipe.id})))
    const categoryLinksOnce = items.flatMap((item) => item.categories.map((category) => ({source: category, target: item.id})))


    // const drag = (simulation: d3.Simulation<any, undefined>) => {
    //     function dragstarted(event, d) {
    //         if (!event.active) simulation.alphaTarget(0.3).restart();
    //         d.fx = d.x;
    //         d.fy = d.y;
    //     }

    //     function dragged(event, d) {
    //         d.fx = event.x;
    //         d.fy = event.y;
    //     }

    //     function dragended(event, d) {
    //         if (!event.active) simulation.alphaTarget(0);
    //         d.fx = null;
    //         d.fy = null;
    //     }

    //     return d3.drag()
    //         .on("start", dragstarted)
    //         .on("drag", dragged)
    //         .on("end", dragended);
    // }
    const categoriesRaw = Array.from(new Set(itemsOnce.flatMap(d => d.categories)))
    console.log(itemsOnce.flatMap(d => d.categories))

    const linkColor = d3.scaleOrdinal(categoriesRaw, d3.schemeCategory10)

    function linkArc(d: { source: DisplayNode; target: DisplayNode }) {
        const r = Math.hypot(d.target.x! - d.source.x!, d.target.y! - d.source.y!);
        return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
  `;
    }

    const chart = () => {
        const itemNodes: DisplayNode[] = itemsOnce.map(d => Object.create(d));
        const categoryNodes: DisplayNode[] = categoriesRaw.map(d => Object.create({id: d, fy: height - priceToHeight(0, true), type: 'category'}));

        const itemLinks = itemLinksOnce
            .map<DisplayLink>(d => ({
                type: 'item',
                source: itemNodes.find((item) => item.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!
            }))
            .filter(d => d.source && d.target);

        const categoryLinks = categoryLinksOnce
            .map<DisplayLink>(d => ({
                type: 'category',
                source: categoryNodes.find((item) => item.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!
            }))
            .filter(d => d.source && d.target);


        const simulation = d3.forceSimulation([...itemNodes, ...categoryNodes])
            .force("link", d3.forceLink<DisplayNode, DisplayLink>([...itemLinks, ...categoryLinks]).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-400))
            // .force("x", d3.forceX())
            // .force("y", d3.forceY());

        const svg = d3.select('body').append("svg")
            .style("font", "12px sans-serif");

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
            .data([...itemLinks, ...categoryLinks])
            .join("path")
            .attr("stroke-width", d => d.type === 'category' ? 0.5 : 1.5)
            .attr("stroke", d => linkColor(d.type === 'category' ? d.source.id : d.target.id))
            // .attr("marker-end", d => `url(${new URL(`#arrow-${d.target.id}`)})`);

        const node = svg.append("g")
            .attr("fill", "currentColor")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .selectAll("g")
            .data([...itemNodes, ...categoryNodes])
            .join("g")
            // .call(drag(simulation));

        node.append("circle")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("r", (d) => d.type === 'category' ? 8 : 4);

        node.append("text")
            .attr("x", 4)
            .attr("y", "0.31em")
            .attr("transform", "translate(0, 0) rotate(-45)")
            .text(d => d.id)
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 3);

        simulation.on("tick", () => {
            link.attr("d", linkArc);
            node.attr("transform", d => `translate(${d.x},${d.y})`);

            const margin = 30

            const minLeft = itemNodes.reduce((min, node) => Math.min(min, node.x ?? 0), 0) - margin
            const viewbox = [
                minLeft,
                -margin,
                itemNodes.reduce((max, node) => Math.max(max, node.x ?? 0), 0) + margin * 10 - minLeft,
                height + margin,
            ]

            svg
                .attr("viewBox", viewbox)
                .attr("width", viewbox[2] - viewbox[0])
                .attr("height", viewbox[3] - viewbox[1])
        });

        // invalidation.then(() => simulation.stop());

        return svg.node();
    }
    
    chart()

})().catch((err) => console.error(err))
