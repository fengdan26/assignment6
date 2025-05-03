import React from "react";
import { treemap, hierarchy, scaleOrdinal, schemeTableau10 } from "d3";

export function TreeMap(props) {
  const {
    margin,
    svg_width,
    svg_height,
    tree,
    selectedCell,
    setSelectedCell,
  } = props;

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom;

  const root = hierarchy(tree)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  treemap().size([innerWidth, innerHeight]).padding(1)(root);

  const level1Group = root.children || [];
  const color = scaleOrdinal(schemeTableau10);

  const colorLegendValues = Array.from(
    new Set(
      root
        .leaves()
        .map((leaf) => `${leaf.parent.data.attr}: ${leaf.parent.data.name}`)
    )
  );

  return (
    <div>
      {/* ✅ 图例区域 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
          marginLeft: `${margin.left}px`,
        }}
      >
        {colorLegendValues.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 20,
                height: 20,
                background: color(label),
              }}
            />
            <span style={{ fontSize: "14px" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ✅ 主 SVG 区域 */}
      <svg
        viewBox={`0 0 ${svg_width} ${svg_height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {level1Group.map((group, i) => {
            const subGroups = group.children || [];

            // ⬇️ 每个二级子区也做一次局部 treemap（让其叶子占满空间）
            subGroups.forEach((sub) => {
              const localHierarchy = hierarchy(sub)
                .sum((d) => d.value)
                .sort((a, b) => b.value - a.value);

              treemap()
                .size([sub.x1 - sub.x0, sub.y1 - sub.y0])
                .padding(1)(localHierarchy);

              localHierarchy.each((node) => {
                node.x0 += sub.x0;
                node.x1 += sub.x0;
                node.y0 += sub.y0;
                node.y1 += sub.y0;
              });
            });

            return (
              <g key={i}>
                {/* 第一级灰框 */}
                <rect
                  x={group.x0}
                  y={group.y0}
                  width={group.x1 - group.x0}
                  height={group.y1 - group.y0}
                  fill="none"
                  stroke="#999"
                  strokeWidth={1.5}
                />

                {/* 叶子节点填充 */}
                {group.leaves().map((d, j) => (
                  <g
                    key={j}
                    transform={`translate(${d.x0}, ${d.y0})`}
                    onClick={() => setSelectedCell(d.data)}
                  >
                    <rect
                      width={d.x1 - d.x0}
                      height={d.y1 - d.y0}
                      fill={color(`${d.parent.data.attr}: ${d.parent.data.name}`)}
                      stroke="white"
                    />
                    <text
                      x={4}
                      y={14}
                      fontSize="12"
                      fill="black"
                      style={{ pointerEvents: "none" }}
                    >
                      {`${d.data.attr}: ${d.data.name}`}
                    </text>
                    <text
                      x={4}
                      y={28}
                      fontSize="12"
                      fill="black"
                      style={{ pointerEvents: "none" }}
                    >
                      {`Value: ${d.data.value}`}
                    </text>
                  </g>
                ))}

                {/* 一级大字标签 */}
                <text
                  key={`label-${i}`}
                  x={(group.x0 + group.x1) / 2}
                  y={(group.y0 + group.y1) / 2}
                  textAnchor="middle"
                  fontSize={Math.max(
                    12,
                    Math.min(group.x1 - group.x0, group.y1 - group.y0) * 0.08
                  )}
                  fill="#000"
                  opacity={0.3}
                  pointerEvents="none"
                  style={{ fontWeight: "bold" }}
                >
                  {`${group.data.attr}: ${group.data.name}`}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
