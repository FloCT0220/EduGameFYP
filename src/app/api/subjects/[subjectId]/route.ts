import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

interface Subject {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  icon: string;
  color_theme: string;
}

interface Node {
  id: number;
  node_id: string;
  name: string;
  description: string;
  level: number;
  x: number;
  y: number;
  points: number;
  difficulty: string;
  estimated_time: string;
  type: string;
  icon: string;
  is_active: boolean;
}

interface Prereq {
  node_id: number;
  prerequisite_node_id: number;
  prereq_node_code: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await context.params;
    // Fetch subject info
    const subjects = await query(
      'SELECT id, title, description, difficulty, icon, color_theme FROM subjects WHERE id = ?',
      [subjectId]
    ) as Subject[];
    const subject = subjects[0];
    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }
    // Fetch nodes for the subject
    const nodes = await query(
      'SELECT id, node_id, title as name, description, level, position_x as x, position_y as y, points, difficulty, estimated_time, type, icon, is_active FROM skill_nodes WHERE subject_id = ? AND is_active = 1',
      [subjectId]
    ) as Node[];
    // Fetch prerequisites for these nodes
    const requirementsMap: { [nodeId: number]: string[] } = {};
    if (nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      const prereqs = await query(
        `SELECT np.node_id, np.prerequisite_node_id, sn.node_id as prereq_node_code
         FROM node_prerequisites np
         JOIN skill_nodes sn ON np.prerequisite_node_id = sn.id
         WHERE np.node_id IN (${nodeIds.map(() => '?').join(',')})`,
        nodeIds
      ) as Prereq[];
      prereqs.forEach(pr => {
        if (!requirementsMap[pr.node_id]) requirementsMap[pr.node_id] = [];
        requirementsMap[pr.node_id].push(pr.prereq_node_code);
      });
    }
    // Attach requirements to each node
    const nodesWithRequirements = nodes.map(node => ({
      ...node,
      requirements: requirementsMap[node.id] || []
    }));
    // Fetch connections for the graph
    const nodeIds = nodes.map((n) => n.id);
    let connections: { from: string; to: string }[] = [];
    if (nodeIds.length > 0) {
      const prereqs = await query(
        `SELECT node_id, prerequisite_node_id FROM node_prerequisites WHERE node_id IN (${nodeIds.map(() => '?').join(',')})`,
        nodeIds
      ) as { node_id: number; prerequisite_node_id: number }[];
      connections = prereqs.map((pr) => ({ from: pr.prerequisite_node_id.toString(), to: pr.node_id.toString() }));
    }
    return NextResponse.json({ success: true, subject, nodes: nodesWithRequirements, connections });
  } catch (error) {
    console.error('Error fetching subject nodes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subject nodes' }, { status: 500 });
  }
} 