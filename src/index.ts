/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="d3" />
/// <reference path="./common.ts" />
// import d3 from 'd3'
// import { Item, Recipe } from './common'

interface ItemFixed extends Item, d3.SimulationNodeDatum {
    fy: number
}

(async () => {
    const priceToHeight = (price: number) => Math.max(2, Math.log2(price)) * 100

    const recipes = (await (await fetch('./recipes.json')).json() as Recipe[])
    const itemsRaw = (await (await fetch('./items.json')).json() as Item[])

    const height = itemsRaw.reduce((max, item) => Math.max(max, priceToHeight(item.price)), 0)
    const width = 10000

    const itemsOnce = (await (await fetch('./items.json')).json() as Item[])
        .map((item) => ({
            ...item,
            fy: height - priceToHeight(item.price)
        }) as ItemFixed)

    const linksOnce = recipes.flatMap((recipe) => recipe.parts.filter((part) => part.input > 0).map((part) => ({source: part.id, target: recipe.id})))


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
    const types = Array.from(new Set(itemsOnce.map(d => d.id)))

    const linkColor = d3.scaleOrdinal(types, d3.schemeCategory10)
    function linkArc(d: { source: ItemFixed; target: ItemFixed }) {
        const r = Math.hypot(d.target.x! - d.source.x!, d.target.y! - d.source.y!);
        return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
  `;
    }

    const chart = () => {
        const nodes: ItemFixed[] = itemsOnce.map(d => Object.create(d));
        const links = linksOnce
            .map(d => ({source: nodes.find((item) => item.id === d.source)!, target: nodes.find((item) => item.id === d.target)!}))
            .filter(d => d.source && d.target);


        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink<ItemFixed, {source: ItemFixed;target: ItemFixed;}>(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-50))
            // .force("x", d3.forceX())
            // .force("y", d3.forceY());

        const svg = d3.select('body').append("svg")
            .attr("viewBox", [-width / 2, -50, width / 2, height])
            // .attr("preserveAspectRatio", "xMidYMax slice")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("font", "12px sans-serif");

        // Per-type markers, as they don't inherit styles.
        // svg.append("defs").selectAll("marker")
        //     .data(types)
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
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("stroke", d => linkColor(d.target.id))
            // .attr("marker-end", d => `url(${new URL(`#arrow-${d.target.id}`)})`);

        const node = svg.append("g")
            .attr("fill", "currentColor")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .selectAll("g")
            .data(nodes)
            .join("g")
            // .call(drag(simulation));

        node.append("circle")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("r", 4);

        node.append("text")
            .attr("x", 8)
            .attr("y", "0.31em")
            .text(d => d.id)
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 3);

        simulation.on("tick", () => {
            link.attr("d", linkArc);
            node.attr("transform", d => `translate(${d.x},${d.y})`);

            const margin = 30

            const minLeft = nodes.reduce((min, node) => Math.min(min, node.x ?? 0), 0) - margin
            const viewbox = [
                minLeft,
                -margin,
                nodes.reduce((max, node) => Math.max(max, node.x ?? 0), 0) + margin * 10 - minLeft,
                height + margin,
            ]

            console.log(viewbox)

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
