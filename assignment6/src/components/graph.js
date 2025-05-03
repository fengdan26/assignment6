import { useEffect, useRef } from 'react'; 
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';   
import { drag } from '../utils/drag';

export function Graph(props) {
    const { margin, svg_width, svg_height, data } = props;

    const nodes = getNodes({ rawData: data });
    const links = getLinks({ rawData: data });

    const width = svg_width - margin.left - margin.right;
    const height = svg_height - margin.top - margin.bottom;

    const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
    const radius = d3.scaleLinear().range([10, 50])
        .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
    const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map(d => d.name));

    const d3Selection = useRef();
    const svgRef = useRef(); // ✅ 新增：SVG 本体引用

    useEffect(() => {
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20 / d.value))
            .force("charge", d3.forceManyBody())
            .force("centrer", d3.forceCenter(width / 2, height / 2))
            .force("y", d3.forceY([height / 2]).strength(0.02))
            .force("collide", d3.forceCollide().radius(d => radius(d.value) + 20))
            .tick(3000);

        let g = d3.select(d3Selection.current);

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => lineWidth(d.value));

        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .enter();

        const point = node.append("circle")
            .attr("r", d => radius(d.value))
            .attr("fill", d => color(d.name))
            .call(drag(simulation));

        // ✅ 添加 legend 到 SVG 左上角
        const legendData = nodes.map(d => ({
            name: d.name,
            color: color(d.name)
        }));

        const svgElement = d3.select(svgRef.current); // ✅ 获取 SVG 本体
        const legend = svgElement.append("g")
            .attr("class", "legend-fixed")
            .attr("transform", "translate(20, 20)");

        legend.selectAll("legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .each(function(d) {
                const item = d3.select(this);
                item.append("circle")
                    .attr("r", 8)
                    .attr("fill", d.color)
                    .attr("cy", 5);

                item.append("text")
                    .attr("x", 15)
                    .attr("y", 9)
                    .style("font-size", "14px")
                    .text(d.name);
            });

    }, [width, height]);

    return (
        <svg
            ref={svgRef} // ✅ 添加 svg 引用
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
        >
            <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}>
            </g>
        </svg>
    );
}
