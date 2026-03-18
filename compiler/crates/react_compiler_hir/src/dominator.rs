// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Dominator and post-dominator tree computation.
//!
//! Port of Dominator.ts and ComputeUnconditionalBlocks.ts.
//! Uses the Cooper/Harvey/Kennedy algorithm from
//! https://www.cs.rice.edu/~keith/Embed/dom.pdf

use std::collections::{HashMap, HashSet};

use crate::{BlockId, HirFunction, Terminal};

// =============================================================================
// Public types
// =============================================================================

/// Stores the immediate post-dominator for each block.
pub struct PostDominator {
    /// The exit node (synthetic node representing function exit).
    pub exit: BlockId,
    nodes: HashMap<BlockId, BlockId>,
}

impl PostDominator {
    /// Returns the immediate post-dominator of the given block, or None if
    /// the block post-dominates itself (i.e., it is the exit node).
    pub fn get(&self, id: BlockId) -> Option<BlockId> {
        let dominator = self.nodes.get(&id).expect("Unknown node in post-dominator tree");
        if *dominator == id {
            None
        } else {
            Some(*dominator)
        }
    }
}

// =============================================================================
// Graph representation
// =============================================================================

struct Node {
    id: BlockId,
    index: usize,
    preds: HashSet<BlockId>,
    succs: HashSet<BlockId>,
}

struct Graph {
    entry: BlockId,
    /// Nodes stored in iteration order (RPO for reverse graph).
    nodes: Vec<Node>,
    /// Map from BlockId to index in the nodes vec.
    node_index: HashMap<BlockId, usize>,
}

impl Graph {
    fn get_node(&self, id: BlockId) -> &Node {
        let idx = self.node_index[&id];
        &self.nodes[idx]
    }
}

// =============================================================================
// Terminal successor iteration
// =============================================================================

/// Yield all successor block IDs of a terminal.
/// Port of TS `eachTerminalSuccessor`.
pub fn each_terminal_successor(terminal: &Terminal) -> Vec<BlockId> {
    match terminal {
        Terminal::Goto { block, .. } => vec![*block],
        Terminal::If { consequent, alternate, .. } => vec![*consequent, *alternate],
        Terminal::Branch { consequent, alternate, .. } => vec![*consequent, *alternate],
        Terminal::Switch { cases, .. } => {
            cases.iter().map(|c| c.block).collect()
        }
        Terminal::Optional { test, .. }
        | Terminal::Ternary { test, .. }
        | Terminal::Logical { test, .. } => vec![*test],
        Terminal::Return { .. } | Terminal::Throw { .. } => vec![],
        Terminal::DoWhile { loop_block, .. } => vec![*loop_block],
        Terminal::While { test, .. } => vec![*test],
        Terminal::For { init, .. } => vec![*init],
        Terminal::ForOf { init, .. } => vec![*init],
        Terminal::ForIn { init, .. } => vec![*init],
        Terminal::Label { block, .. } => vec![*block],
        Terminal::Sequence { block, .. } => vec![*block],
        Terminal::MaybeThrow { continuation, handler, .. } => {
            let mut succs = vec![*continuation];
            if let Some(h) = handler {
                succs.push(*h);
            }
            succs
        }
        Terminal::Try { block, .. } => vec![*block],
        Terminal::Scope { block, .. } | Terminal::PrunedScope { block, .. } => vec![*block],
        Terminal::Unreachable { .. } | Terminal::Unsupported { .. } => vec![],
    }
}

// =============================================================================
// Post-dominator tree computation
// =============================================================================

/// Compute the post-dominator tree for a function.
///
/// If `include_throws_as_exit_node` is true, throw terminals are treated as
/// exit nodes (like return). Otherwise, only return terminals feed into exit.
pub fn compute_post_dominator_tree(
    func: &HirFunction,
    next_block_id_counter: u32,
    include_throws_as_exit_node: bool,
) -> PostDominator {
    let graph = build_reverse_graph(func, next_block_id_counter, include_throws_as_exit_node);
    let mut nodes = compute_immediate_dominators(&graph);

    // When include_throws_as_exit_node is false, nodes that flow into a throw
    // terminal and don't reach the exit won't be in the node map. Add them
    // with themselves as dominator.
    if !include_throws_as_exit_node {
        for (id, _) in &func.body.blocks {
            nodes.entry(*id).or_insert(*id);
        }
    }

    PostDominator {
        exit: graph.entry,
        nodes,
    }
}

/// Build the reverse graph from the HIR function.
///
/// Reverses all edges and adds a synthetic exit node that receives edges from
/// return (and optionally throw) terminals. The result is put into RPO order.
fn build_reverse_graph(
    func: &HirFunction,
    next_block_id_counter: u32,
    include_throws_as_exit_node: bool,
) -> Graph {
    let exit_id = BlockId(next_block_id_counter);

    // Build initial nodes with reversed edges
    let mut raw_nodes: HashMap<BlockId, Node> = HashMap::new();

    // Create exit node
    raw_nodes.insert(exit_id, Node {
        id: exit_id,
        index: 0,
        preds: HashSet::new(),
        succs: HashSet::new(),
    });

    for (id, block) in &func.body.blocks {
        let successors = each_terminal_successor(&block.terminal);
        let mut preds_set: HashSet<BlockId> = successors.into_iter().collect();
        let succs_set: HashSet<BlockId> = block.preds.iter().copied().collect();

        let is_return = matches!(&block.terminal, Terminal::Return { .. });
        let is_throw = matches!(&block.terminal, Terminal::Throw { .. });

        if is_return || (is_throw && include_throws_as_exit_node) {
            preds_set.insert(exit_id);
            raw_nodes.get_mut(&exit_id).unwrap().succs.insert(*id);
        }

        raw_nodes.insert(*id, Node {
            id: *id,
            index: 0,
            preds: preds_set,
            succs: succs_set,
        });
    }

    // DFS from exit to compute RPO
    let mut visited = HashSet::new();
    let mut postorder = Vec::new();
    dfs_postorder(exit_id, &raw_nodes, &mut visited, &mut postorder);

    // Reverse postorder
    postorder.reverse();

    let mut nodes = Vec::with_capacity(postorder.len());
    let mut node_index = HashMap::new();
    for (idx, id) in postorder.into_iter().enumerate() {
        let mut node = raw_nodes.remove(&id).unwrap();
        node.index = idx;
        node_index.insert(id, idx);
        nodes.push(node);
    }

    Graph {
        entry: exit_id,
        nodes,
        node_index,
    }
}

fn dfs_postorder(
    id: BlockId,
    nodes: &HashMap<BlockId, Node>,
    visited: &mut HashSet<BlockId>,
    postorder: &mut Vec<BlockId>,
) {
    if !visited.insert(id) {
        return;
    }
    if let Some(node) = nodes.get(&id) {
        for &succ in &node.succs {
            dfs_postorder(succ, nodes, visited, postorder);
        }
    }
    postorder.push(id);
}

// =============================================================================
// Dominator fixpoint (Cooper/Harvey/Kennedy)
// =============================================================================

fn compute_immediate_dominators(graph: &Graph) -> HashMap<BlockId, BlockId> {
    let mut doms: HashMap<BlockId, BlockId> = HashMap::new();
    doms.insert(graph.entry, graph.entry);

    let mut changed = true;
    while changed {
        changed = false;
        for node in &graph.nodes {
            if node.id == graph.entry {
                continue;
            }

            // Find first processed predecessor
            let mut new_idom: Option<BlockId> = None;
            for &pred in &node.preds {
                if doms.contains_key(&pred) {
                    new_idom = Some(pred);
                    break;
                }
            }
            let mut new_idom = new_idom.unwrap_or_else(|| {
                panic!(
                    "At least one predecessor must have been visited for block {:?}",
                    node.id
                )
            });

            // Intersect with other processed predecessors
            for &pred in &node.preds {
                if pred == new_idom {
                    continue;
                }
                if doms.contains_key(&pred) {
                    new_idom = intersect(pred, new_idom, graph, &doms);
                }
            }

            if doms.get(&node.id) != Some(&new_idom) {
                doms.insert(node.id, new_idom);
                changed = true;
            }
        }
    }
    doms
}

fn intersect(
    a: BlockId,
    b: BlockId,
    graph: &Graph,
    doms: &HashMap<BlockId, BlockId>,
) -> BlockId {
    let mut block1 = graph.get_node(a);
    let mut block2 = graph.get_node(b);
    while block1.id != block2.id {
        while block1.index > block2.index {
            let dom = doms[&block1.id];
            block1 = graph.get_node(dom);
        }
        while block2.index > block1.index {
            let dom = doms[&block2.id];
            block2 = graph.get_node(dom);
        }
    }
    block1.id
}

// =============================================================================
// Unconditional blocks
// =============================================================================

/// Compute the set of blocks that are unconditionally executed from the entry.
///
/// Port of ComputeUnconditionalBlocks.ts. Walks the immediate post-dominator
/// chain starting from the function entry. A block is unconditional if it lies
/// on this chain (meaning every path through the function must pass through it).
pub fn compute_unconditional_blocks(
    func: &HirFunction,
    next_block_id_counter: u32,
) -> HashSet<BlockId> {
    let mut unconditional = HashSet::new();
    let dominators = compute_post_dominator_tree(func, next_block_id_counter, false);
    let exit = dominators.exit;
    let mut current: Option<BlockId> = Some(func.body.entry);

    while let Some(block_id) = current {
        if block_id == exit {
            break;
        }
        assert!(
            !unconditional.contains(&block_id),
            "Internal error: non-terminating loop in ComputeUnconditionalBlocks"
        );
        unconditional.insert(block_id);
        current = dominators.get(block_id);
    }

    unconditional
}
