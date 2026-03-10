import { useMemo, useState, useCallback } from "react";
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
import { CheckCircle } from "lucide-react";
import type { SectionContent } from "./types";
import { mindMapNodeTypes } from "./flow/nodeTypes";

interface MindMapViewProps {
  sectionContent: SectionContent;
}

/* ── Layout helpers ──────────────────────────────────────────────────────── */

const X_GAP = 400;
const Y_BRANCH = 200;
const Y_LEAF = 80;

function buildGraph(section: SectionContent) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const edgeDefaults = {
    type: "smoothstep" as const,
    animated: true,
    style: { stroke: "rgba(255,255,255,.12)", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,.2)" },
  };

  // Root
  const rootId = "root";
  nodes.push({
    id: rootId,
    type: "mindMapRoot",
    position: { x: 0, y: 0 },
    data: { label: section.title },
  });

  // Branch definitions
  const branches = [
    {
      id: "branch-articles",
      label: "Articles",
      items: section.articlePages.map((p) => p.pageTitle),
    },
    {
      id: "branch-flashcards",
      label: "Flashcards",
      items: section.flashcards.map((f) =>
        f.front.length > 50 ? f.front.slice(0, 50) + "…" : f.front
      ),
    },
    {
      id: "branch-quizzes",
      label: "Quizzes",
      items: [
        `${section.mcqQuestions.length} MCQ`,
        `${section.trueFalseQuestions.length} True / False`,
        `${section.fillUpQuestions.length} Fill-ups`,
      ],
    },
  ];

  const totalWidth = (branches.length - 1) * X_GAP;
  const startX = -totalWidth / 2;

  branches.forEach((branch, bi) => {
    const bx = startX + bi * X_GAP;
    const by = Y_BRANCH;

    nodes.push({
      id: branch.id,
      type: "branchNode",
      position: { x: bx, y: by },
      data: { label: branch.label },
    });

    edges.push({
      id: `e-root-${branch.id}`,
      source: rootId,
      target: branch.id,
      ...edgeDefaults,
    });

    // Leaf nodes — stack vertically under each branch
    branch.items.forEach((item, li) => {
      const leafId = `${branch.id}-leaf-${li}`;
      nodes.push({
        id: leafId,
        type: "leafNode",
        position: {
          x: bx,
          y: by + Y_LEAF + 40 + li * Y_LEAF,
        },
        data: { label: item },
      });

      edges.push({
        id: `e-${branch.id}-${leafId}`,
        source: branch.id,
        target: leafId,
        ...edgeDefaults,
      });
    });
  });

  return { nodes, edges };
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function MindMapView({ sectionContent }: MindMapViewProps) {
  const [isUnderstood, setIsUnderstood] = useState(false);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(sectionContent),
    [sectionContent]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const onInit = useCallback((rf: { fitView: () => void }) => {
    setTimeout(() => rf.fitView(), 50);
  }, []);

  return (
    <div className="relative h-[calc(100vh-64px)] w-full rounded-xl border border-white/10 bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={mindMapNodeTypes}
        onInit={onInit}
        fitView
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-950!"
      >
        <Background color="rgba(255,255,255,.04)" gap={32} />
        <Controls
          showInteractive={false}
          className="rounded-xl! border-white/10! bg-zinc-900! [&>button]:border-white/10! [&>button]:bg-zinc-900! [&>button]:fill-zinc-400! [&>button:hover]:bg-zinc-800! [&>button:hover]:fill-white!"
        />

        {/* Badge */}
        <Panel position="top-right">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-400 backdrop-blur">
            Interactive Mind Map — drag to rearrange
          </div>
        </Panel>

        {/* Understand Button */}
        <Panel position="bottom-center">
          <button
            onClick={() => setIsUnderstood(true)}
            disabled={isUnderstood}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-medium shadow-lg transition-all ${
              isUnderstood
                ? "bg-emerald-500 text-white"
                : "bg-cyan-500 hover:bg-cyan-400 text-white hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
            }`}
          >
            <CheckCircle className="h-5 w-5" />
            {isUnderstood ? "Great job!" : "I Understand This!"}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
