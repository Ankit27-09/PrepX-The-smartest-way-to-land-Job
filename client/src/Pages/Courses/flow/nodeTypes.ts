import {
  CourseNode,
  SectionNode,
  ContentNode,
  MindMapRootNode,
  BranchNode,
  LeafNode,
} from "./FlowNodes";

export const eagleNodeTypes = {
  courseNode: CourseNode,
  sectionNode: SectionNode,
  contentNode: ContentNode,
};

export const mindMapNodeTypes = {
  mindMapRoot: MindMapRootNode,
  branchNode: BranchNode,
  leafNode: LeafNode,
};
