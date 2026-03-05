import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Course, CourseDetail, ContentType } from "./types";
import { eagleNodeTypes } from "./flow/nodeTypes";

interface EagleViewProps {
  course: Course | CourseDetail;
  onNodeClick: (sectionId: string, type: ContentType) => void;
}

/* ── Layout constants ───────────────────────────────────────────────────── */

const SEC_X_GAP = 320;
const SEC_Y = 200;
const CHILD_Y_OFFSET = 180;
const CHILD_Y_GAP = 70;

/* ── Build graph from course data ───────────────────────────────────────── */

function buildGraph(
  course: Course | CourseDetail,
  onNodeClick: (sectionId: string, type: ContentType) => void
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const edgeDefaults = {
    type: "smoothstep" as const,
    animated: true,
    style: { stroke: "rgba(255,255,255,.10)", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,.15)" },
  };

  // Root course node (centred)
  const rootId = "course-root";
  const sections = course.sections ?? [];
  const totalSections = sections.length;
  const totalWidth = (totalSections - 1) * SEC_X_GAP;
  const rootX = 0;

  nodes.push({
    id: rootId,
    type: "courseNode",
    position: { x: rootX, y: 0 },
    data: { label: course.title },
  });

  const startX = -totalWidth / 2;

  sections.forEach((section, i) => {
    const sectionId = `sec-${section.id}`;
    const sx = startX + i * SEC_X_GAP;

    nodes.push({
      id: sectionId,
      type: "sectionNode",
      position: { x: sx, y: SEC_Y },
      data: {
        label: section.title,
        order: section.sectionNumber,
        completed: section.isCompleted,
      },
    });

    edges.push({
      id: `e-root-${sectionId}`,
      source: rootId,
      target: sectionId,
      ...edgeDefaults,
    });

    // Content children
    const children: { type: ContentType; label: string }[] = [
      { type: "article", label: "Article" },
      { type: "flashcards", label: "Study Material" },
      { type: "mcq", label: "Quiz" },
    ];

    children.forEach((child, ci) => {
      const childId = `${sectionId}-${child.type}`;
      nodes.push({
        id: childId,
        type: "contentNode",
        position: {
          x: sx,
          y: SEC_Y + CHILD_Y_OFFSET + ci * CHILD_Y_GAP,
        },
        data: {
          label: child.label,
          contentType: child.type,
          sectionId: section.id,
          onClick: () => onNodeClick(section.id, child.type),
        },
      });

      edges.push({
        id: `e-${sectionId}-${childId}`,
        source: sectionId,
        target: childId,
        ...edgeDefaults,
      });
    });
  });

  return { nodes, edges };
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function EagleView({ course, onNodeClick }: EagleViewProps) {
  const sections = course.sections ?? [];
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(course, onNodeClick),
    [course, onNodeClick]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const onInit = useCallback((rf: { fitView: () => void }) => {
    setTimeout(() => rf.fitView(), 50);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={eagleNodeTypes}
        onInit={onInit}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-950!"
      >
        <Background color="rgba(255,255,255,.04)" gap={32} />
        <Controls
          showInteractive={false}
          className="rounded-xl! border-white/10! bg-zinc-900! [&>button]:border-white/10! [&>button]:bg-zinc-900! [&>button]:fill-zinc-400! [&>button:hover]:bg-zinc-800! [&>button:hover]:fill-white!"
        />

        {/* Stats panel */}
        <Panel position="top-left">
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 backdrop-blur">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="text-lg">🦅</span>
                Knowledge Graph
              </h2>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                Drag nodes to rearrange • Click content nodes to open
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            {[
              { label: "Sections", value: sections.length },
              { label: "Nodes", value: 1 + sections.length * 4 },
              { label: "Connections", value: sections.length * 4 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-base font-bold text-white">{s.value}</div>
                <div className="text-[9px] text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
