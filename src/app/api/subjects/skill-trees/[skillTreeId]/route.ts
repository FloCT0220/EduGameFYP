import { NextRequest, NextResponse } from 'next/server';
import { query } from "../../../../../../lib/db";

interface SkillTree {
    id: number;
    title: string;
    description: string;
    icon: string;
    order_index: number;
}

interface SkillNode {
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
    completed: number;
    unlocked: number;
}

interface SkillNodeWithRequirements extends SkillNode {
    requirements: string[];
}

interface Prerequisite {
    node_id: number;
    prerequisite_node_id: number;
    prereq_node_id: string;
}

interface Connection {
    from: string;
    to: number;
}

interface PrerequisiteCheck {
    prerequisite_node_id: number;
    node_id: string;
    completed: number;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { skillTreeId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const skillTreeId = params.skillTreeId;

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                error: 'User ID is required' 
            }, { status: 400 });
        }

        // Fetch skill tree details
        const skillTreeQuery = `
            SELECT 
                st.id,
                st.title,
                st.description,
                st.icon,
                st.order_index
            FROM skill_trees st
            WHERE st.id = ? AND st.is_active = 1
        `;

        const skillTrees = await query(skillTreeQuery, [skillTreeId]) as SkillTree[];
        
        if (skillTrees.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Skill tree not found' 
            }, { status: 404 });
        }

        const skillTree = skillTrees[0];

        // Fetch skill nodes with user progress
        const nodesQuery = `
            SELECT 
                sn.id,
                sn.node_id,
                sn.title as name,
                sn.description,
                sn.level,
                sn.position_x as x,
                sn.position_y as y,
                sn.points,
                sn.difficulty,
                sn.estimated_time,
                sn.type,
                sn.icon,
                CASE WHEN unp.completed = 1 THEN 1 ELSE 0 END as completed,
                CASE WHEN unp.completed = 1 OR unp.user_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
            FROM skill_nodes sn
            LEFT JOIN user_node_progress unp ON sn.id = unp.node_id AND unp.user_id = ?
            WHERE sn.skill_tree_id = ? AND sn.is_active = 1
            ORDER BY sn.level, sn.position_x
        `;

        const nodes = await query(nodesQuery, [userId, skillTreeId]) as SkillNode[];

        // Fetch prerequisites for each node
        const prerequisitesQuery = `
            SELECT 
                np.node_id,
                np.prerequisite_node_id,
                sn.node_id as prereq_node_id
            FROM node_prerequisites np
            INNER JOIN skill_nodes sn ON np.prerequisite_node_id = sn.id
            WHERE np.node_id IN (${nodes.map(() => '?').join(',')})
        `;

        const nodeIds = nodes.map((node: SkillNode) => node.id);
        const prerequisites = nodeIds.length > 0 ? await query(prerequisitesQuery, nodeIds) as Prerequisite[] : [];

        // Group prerequisites by node
        const prerequisitesByNode: { [key: string]: string[] } = {};
        prerequisites.forEach((prereq: Prerequisite) => {
            if (!prerequisitesByNode[prereq.node_id]) {
                prerequisitesByNode[prereq.node_id] = [];
            }
            prerequisitesByNode[prereq.node_id].push(prereq.prereq_node_id);
        });

        // Add prerequisites to nodes
        const nodesWithPrerequisites = nodes.map((node: SkillNode): SkillNodeWithRequirements => ({
            ...node,
            requirements: prerequisitesByNode[node.id] || []
        }));

        // Generate connections based on prerequisites
        const connections = prerequisites.map((prereq: Prerequisite): Connection => ({
            from: prereq.prereq_node_id,
            to: prereq.node_id
        }));

        return NextResponse.json({
            success: true,
            skillTree,
            nodes: nodesWithPrerequisites,
            connections
        });

    } catch (error) {
        console.error('Error fetching skill tree:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch skill tree' 
        }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { skillTreeId: string } }
) {
    try {
        const body = await request.json();
        const { userId, nodeId, action } = body;
        const skillTreeId = params.skillTreeId;

        if (!userId || !nodeId || !action) {
            return NextResponse.json({ 
                success: false, 
                error: 'User ID, Node ID, and Action are required' 
            }, { status: 400 });
        }

        if (action === 'unlock') {
            // Check if prerequisites are met
            const prerequisitesQuery = `
                SELECT 
                    np.prerequisite_node_id,
                    sn.node_id,
                    unp.completed
                FROM node_prerequisites np
                INNER JOIN skill_nodes sn ON np.prerequisite_node_id = sn.id
                LEFT JOIN user_node_progress unp ON sn.id = unp.node_id AND unp.user_id = ?
                WHERE np.node_id = ?
            `;

            const prerequisites = await query(prerequisitesQuery, [userId, parseInt(nodeId)]) as PrerequisiteCheck[];
            
            const unmetPrerequisites = prerequisites.filter((prereq: PrerequisiteCheck) => !prereq.completed);
            
            if (unmetPrerequisites.length > 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Prerequisites not met' 
                }, { status: 400 });
            }

            // Unlock the node
            await query(
                `INSERT INTO user_node_progress (user_id, skill_tree_id, node_id, unlocked) 
                 VALUES (?, ?, ?, 1)
                 ON DUPLICATE KEY UPDATE unlocked = 1`,
                [userId, skillTreeId, nodeId]
            );

            return NextResponse.json({
                success: true,
                message: 'Node unlocked successfully'
            });
        }

        if (action === 'complete') {
            // Mark node as completed
            await query(
                `INSERT INTO user_node_progress (user_id, skill_tree_id, node_id, completed, completed_at) 
                 VALUES (?, ?, ?, 1, NOW())
                 ON DUPLICATE KEY UPDATE completed = 1, completed_at = NOW()`,
                [userId, skillTreeId, nodeId]
            );

            return NextResponse.json({
                success: true,
                message: 'Node completed successfully'
            });
        }

        return NextResponse.json({ 
            success: false, 
            error: 'Invalid action' 
        }, { status: 400 });

    } catch (error) {
        console.error('Error updating skill tree:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to update skill tree' 
        }, { status: 500 });
    }
} 