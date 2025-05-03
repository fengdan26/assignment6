import {useEffect, useRef} from 'react'; 
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';   
import {drag} from '../utils/drag';

export function Graph(props) {
    const { margin, svg_width, svg_height, data } = props;

    const nodes = getNodes({rawData: data});
    const links = getLinks({rawData: data});

    const width = svg_width - margin.left - margin.right;
    const height = svg_height - margin.top - margin.bottom;

    const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
    const radius = d3.scaleLinear().range([10, 50])
        .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
    const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map( d => d.name));

    const d3Selection = useRef();

    useEffect(() => {
        const g = d3.select(d3Selection.current);
        g.selectAll("*").remove();  // ✅ 清空旧的图层，防止重复

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20/d.value))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width/2, height/2))
            .force("y", d3.forceY([height/2]).strength(0.02))
            .force("collide", d3.forceCollide().radius(d => radius(d.value)+20))
            .tick(3000);
        
        // 添加 tooltip div（只添加一次）
        const tooltip = d3.select("body").selectAll(".tooltip-d3").data([null])
            .join("div")
            .attr("class", "tooltip-d3")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "rgba(0, 0, 0, 0.7)")
            .style("color", "#fff")
            .style("padding", "5px 10px")
            .style("border-radius", "4px")
            .style("font-size", "14px")
            .style("pointer-events", "none");

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => lineWidth(d.value));

        const nodeGroup = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes, d => d.name)
            .join("circle")
            .attr("r", d => radius(d.value))
            .attr("fill", d => color(d.name))
            .call(drag(simulation))
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible").text(d.name);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeGroup
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        // 添加 legend 到 g 左上角
        const legend = g.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(0, 0)");

        const legendItems = legend.selectAll(".legend-item")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(10, ${i * 25 + 10})`);

        legendItems.append("circle")
            .attr("r", 8)
            .attr("fill", d => color(d.name))
            .attr("cy", 5);

        legendItems.append("text")
            .attr("x", 15)
            .attr("y", 9)
            .style("font-size", "14px")
            .text(d => d.name);
        
    }, [width, height]);

    return (
        <svg 
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        > 
            <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}>
            </g>
        </svg>
    );
};
