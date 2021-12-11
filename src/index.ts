/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="d3" />
/// <reference path="./common.ts" />
// import d3 from 'd3'
// import { Item, Recipe } from './common'

interface DisplayNode extends d3.SimulationNodeDatum {
    id: string
    type: 'item' | 'recipe' | 'category'
    icon?: Item['icon']
    categories?: IdCategoryString[]
}
interface DisplayLink extends d3.SimulationNodeDatum {
    type: 'recipe2item' | 'item2recipe' | 'category2item'
    source: DisplayNode
    target: DisplayNode
}

(async () => {
    const priceToHeight = (price: number, category = false) => Math.max(category ? 1 : 2, Math.log2(price)) * 100

    const ITEMS_RAW = (await (await fetch('./items.json')).json() as Item[])
    const TOTAL_HEIGHT = ITEMS_RAW.reduce((max, item) => Math.max(max, priceToHeight(item.price)), 0)

    const ITEMS = ITEMS_RAW
        .map((item) => ({
            ...item,
            fy: TOTAL_HEIGHT - priceToHeight(item.price)
        }))
    const RECIPES = (await (await fetch('./recipes.json')).json() as Recipe[])
        .map((recipe) => {
            const itemPrice = ITEMS.find((item) => item.id === recipe.result)?.price ?? 0
            const partPriceMax = Math.max(...recipe.parts.map((part) => ITEMS.find((item) => item.id === part.id)?.price ?? 0))
            return {
                ...recipe,
                fy: TOTAL_HEIGHT - (priceToHeight(itemPrice) + priceToHeight(partPriceMax))/2
            }
        })
    const CATEGORIES = Array.from(new Set(ITEMS_RAW.flatMap(d => d.categories)))

    // Debug
    // ITEMS.splice(20)
    // RECIPES.splice(20)
    // CATEGORIES.splice(20)
    // console.log(ITEMS)
    // console.log(RECIPES)
    // console.log(CATEGORIES)

    const RECIPE2ITEM_LINKS = RECIPES.map((recipe) => ({source: recipe.id, target: recipe.result}))
    const ITEM2RECIPE_LINKS = RECIPES.flatMap((recipe) => recipe.parts.map((part) => ({source: part.id, target: recipe.id})))
    const CATEGORY2ITEM_LINKS = ITEMS_RAW.flatMap((item) => item.categories.map((category) => ({source: category, target: item.id})))

    console.log('nodes:', {
        categories: CATEGORIES.length,
        items: ITEMS.length,
        recipes: RECIPES.length,
    })
    console.log('links:', {
        category2item: CATEGORY2ITEM_LINKS.length,
        item2recipe: ITEM2RECIPE_LINKS.length,
        recipe2item: RECIPE2ITEM_LINKS.length,
    })

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

    const linkColor = d3.scaleOrdinal(CATEGORIES, d3.schemeCategory10)

    function linkArc(d: { source: DisplayNode; target: DisplayNode }) {
        return `M ${d.source.x} ${d.source.y} Q ${d.source.x ?? 0} ${d.target.y ?? 0}, ${d.target.x} ${d.target.y}`;
    }

    const chart = () => {
        const itemNodes: DisplayNode[] = ITEMS.map(d => Object.create(d));
        const recipeNodes: DisplayNode[] = RECIPES.map(d => Object.create(d));
        const categoryNodes: DisplayNode[] = CATEGORIES.map(d => Object.create({id: d, fy: TOTAL_HEIGHT - priceToHeight(0, true), type: 'category'}));

        const recipe2itemLinks = RECIPE2ITEM_LINKS
            .map<DisplayLink>(d => ({
                type: 'recipe2item',
                source: recipeNodes.find((recipe) => recipe.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!,
            }))
            .filter(d => d.source && d.target);

        const item2recipeLinks = ITEM2RECIPE_LINKS
            .map<DisplayLink>(d => ({
                type: 'item2recipe',
                source: itemNodes.find((item) => item.id === d.source)!,
                target: recipeNodes.find((recipe) => recipe.id === d.target)!,
            }))
            .filter(d => d.source && d.target);

        const categoryLinks = CATEGORY2ITEM_LINKS
            .map<DisplayLink>(d => ({
                type: 'category2item',
                source: categoryNodes.find((item) => item.id === d.source)!,
                target: itemNodes.find((item) => item.id === d.target)!
            }))
            .filter(d => d.source && d.target);


        const simulation = d3.forceSimulation([...itemNodes, ...categoryNodes, ...recipeNodes])
            .force("link", d3.forceLink<DisplayNode, DisplayLink>([...recipe2itemLinks, ...item2recipeLinks, ...categoryLinks]).id(d => d.type + d.id))
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
            .data([...recipe2itemLinks, ...item2recipeLinks])
            .join("path")
            .attr("stroke-width", 1.5)
            .attr("stroke", d => linkColor(d.target.id.replace('recipe-', '')))
            // .attr("marker-end", d => `url(${new URL(`#arrow-${d.target.id}`)})`);

        const node = svg.append("g")
            .attr("fill", "currentColor")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .selectAll("g")
            .data([...itemNodes, ...recipeNodes])
            .join("g")
            // .call(drag(simulation));

        // node.append("circle")
        //     .attr("stroke", "white")
        //     .attr("stroke-width", 1.5)
        //     .attr("r", (d) => d.type === 'category' ? 8 : 4);

        const iconSize = 48
        const strokeWidth = 4

        node
            .append("rect")
            .attr("x", -iconSize/2 - strokeWidth/4)
            .attr("y", -iconSize/2 - strokeWidth/4)
            .attr("width", iconSize + strokeWidth/2)
            .attr("height", iconSize + strokeWidth/2)
            .attr("fill", "#bbb")
            .attr("stroke", d => linkColor(d.categories?.[0] ?? 'recipe'))
            .attr("stroke-width", strokeWidth);

        node
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
                TOTAL_HEIGHT + margin,
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
