import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

interface MindmapTreeProps {
  data: TreeNode | null;
  width?: number;
  height?: number;
}

export const MindmapTree: React.FC<MindmapTreeProps> = ({
  data,
  width = 900,
  height = 900,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !ref.current) return;

    d3.select(ref.current).selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - 60;

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const cluster = d3
      .cluster<TreeNode>()
      .size([360, radius]);

    const root = d3.hierarchy<TreeNode>(data);

    cluster(root);

    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d =>
        d3
          .linkRadial()
          .angle(d => ((d as any).x * Math.PI) / 180)
          .radius(d => (d as any).y)(d as any)
      )
      .attr("fill", "none")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1.5);

    const node = svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `
        rotate(${d.x - 90})
        translate(${d.y},0)
      `);

    node
      .append("circle")
      .attr("r", 6)
      .attr("fill", "#7aa3cc");

    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d.x < 180 ? 12 : -12))
      .attr("text-anchor", d => (d.x < 180 ? "start" : "end"))
      .attr("transform", d => (d.x >= 180 ? "rotate(180)" : null))
      .style("font-size", "13px")
      .style("fill", "#fff")
      .text(d => d.data.name);

  }, [data, width, height]);

  return (
    <svg ref={ref} style={{ background: "#111", borderRadius: 12, width, height }} />
  );
};
