import { useState, useCallback, useEffect, useRef } from 'react';
import { getI18n } from 'nordic/i18n';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import { Typography } from '@andes/react/typography';

import { createSorter } from '../../../../../services/wcs-service';
import { updateTopology } from '../../../../../services/wcs-service';

import { WcsNode } from './wcs-node';
import { WcsEdge } from './wcs-edge';
import { TopToolbar } from './top-toolbar';
import { LeftPalette } from './left-palette';
import { PropertiesPanel } from './properties-panel';
import { BottomBar } from './bottom-bar';
import { SettingsModal } from './settings-modal';

const NODE_TYPES = { wcsNode: WcsNode };
const EDGE_TYPES = { wcsEdge: WcsEdge };

const toFlowNodes = (nodes) =>
  (nodes || []).map((n, idx) => ({
    id: n.id,
    type: 'wcsNode',
    position: n._position || { x: 100 + idx * 160, y: 100 },
    data: { id: n.id, name: n.name, type: n.type, capacity: n.capacity },
  }));

const toFlowEdges = (edges) =>
  (edges || []).map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: 'wcsEdge',
    data: {
      id: e.id,
      distance_m: e.distance_m,
      max_throughput_tu_per_min: e.max_throughput_tu_per_min,
    },
  }));

const toApiNodes = (flowNodes) =>
  flowNodes.map((n) => ({
    id: n.data.id,
    name: n.data.name,
    type: n.data.type,
    capacity: n.data.capacity,
    _position: n.position,
  }));

const toApiEdges = (flowEdges) =>
  flowEdges.map((e) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    distance_m: e.data?.distance_m ?? 0,
    max_throughput_tu_per_min: e.data?.max_throughput_tu_per_min ?? 1,
  }));

const validateTopology = (nodes, edges, constraints) => {
  const errs = [];

  if (nodes.length === 0) {
    errs.push('Topology must have at least one node.');
  }

  const nodeIds = new Set(nodes.map((n) => n.data.id));
  const seenIds = new Set();

  for (const n of nodes) {
    if (seenIds.has(n.data.id)) {
      errs.push(`Duplicate node ID: "${n.data.id}".`);
    }
    seenIds.add(n.data.id);
  }

  for (const e of edges) {
    if (!nodeIds.has(e.source)) {
      errs.push(`Edge "${e.id}" references unknown source node "${e.source}".`);
    }
    if (!nodeIds.has(e.target)) {
      errs.push(`Edge "${e.id}" references unknown target node "${e.target}".`);
    }
  }

  if (
    constraints.max_tu_weight_kg != null &&
    (constraints.max_tu_weight_kg <= 0 || constraints.max_tu_weight_kg > 200)
  ) {
    errs.push('Max TU weight must be between 0 and 200 kg.');
  }

  return errs;
};

const GraphEditorInner = ({ initialData, isNew }) => {
  const i18n = getI18n();

  const [nodes, setNodes] = useState(() => toFlowNodes(initialData?.nodes));
  const [edges, setEdges] = useState(() => toFlowEdges(initialData?.edges));
  const [constraints, setConstraints] = useState(() => initialData?.global_constraints || {});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sorterId = isNew ? null : initialData?.sorter_id;
  const sorterName = isNew ? '' : initialData?.sorter_name || '';

  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: nanoid(8),
            type: 'wcsEdge',
            data: { distance_m: 0, max_throughput_tu_per_min: 1 },
          },
          eds,
        ),
      ),
    [],
  );

  const onNodeClick = useCallback((_e, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((_e, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/wcs-node-type');

      if (!nodeType) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newId = nanoid(8);

      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type: 'wcsNode',
          position,
          data: { id: newId, name: `${nodeType}-${nds.length + 1}`, type: nodeType, capacity: 0 },
        },
      ]);
    },
    [screenToFlowPosition],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  useEffect(() => {
    const handleAddNode = (e) => {
      const { type } = e.detail;
      const wrapper = reactFlowWrapper.current;
      const rect = wrapper
        ? wrapper.getBoundingClientRect()
        : { left: 0, top: 0, width: 800, height: 600 };
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const newId = nanoid(8);

      setNodes((nds) => [
        ...nds,
        {
          id: newId,
          type: 'wcsNode',
          position,
          data: { id: newId, name: `${type}-${nds.length + 1}`, type, capacity: 0 },
        },
      ]);
      setSelectedNodeId(newId);
    };

    document.addEventListener('wcs:add-node', handleAddNode);

    return () => document.removeEventListener('wcs:add-node', handleAddNode);
  }, [screenToFlowPosition]);

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n)),
    );
  }, []);

  const handleUpdateEdge = useCallback((edgeId, updates) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...updates } } : e,
      ),
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId]);

  const handleValidate = useCallback(() => {
    const errs = validateTopology(nodes, edges, constraints);

    setValidationErrors(errs);

    return errs.length === 0;
  }, [nodes, edges, constraints]);

  const handleSave = useCallback(async () => {
    const valid = handleValidate();

    if (!valid) return;

    setSaving(true);
    setSaveError(null);

    const payload = {
      sorter_id: sorterId,
      sorter_name: sorterName,
      global_constraints: constraints,
      nodes: toApiNodes(nodes),
      edges: toApiEdges(edges),
    };

    let result;

    if (isNew) {
      result = await createSorter(payload);
    } else {
      result = await updateTopology(sorterId, payload);
    }

    setSaving(false);

    if (result.error) {
      setSaveError(
        result.error.errors
          ? result.error.errors.join(' ')
          : i18n.gettext('Could not save. Please try again.'),
      );

      return;
    }

    if (isNew && result.data?.sorter_id) {
      window.location.href = `/wcs-setup/editor/${result.data.sorter_id}`;
    }
  }, [isNew, sorterId, sorterName, nodes, edges, constraints, handleValidate, i18n]);

  const handleExport = useCallback(() => {
    const payload = {
      sorter_id: sorterId,
      sorter_name: sorterName,
      global_constraints: constraints,
      nodes: toApiNodes(nodes),
      edges: toApiEdges(edges),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${sorterId || 'topology'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorterId, sorterName, nodes, edges, constraints]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;

  return (
    <div className="graph-editor-app">
      <TopToolbar
        saving={saving}
        saveError={saveError}
        isNew={isNew}
        onSave={handleSave}
        onValidate={handleValidate}
        onExport={handleExport}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="graph-editor-app__workspace">
        <LeftPalette />

        <div
          className="graph-editor-app__flow"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            fitView
            deleteKeyCode="Delete"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {(selectedNode || selectedEdge) && (
          <PropertiesPanel
            node={selectedNode}
            edge={selectedEdge}
            onUpdateNode={handleUpdateNode}
            onUpdateEdge={handleUpdateEdge}
            onDelete={handleDeleteSelected}
          />
        )}
      </div>

      <BottomBar
        errors={validationErrors}
        onErrorClick={(err) => {
          // Surface the error — simple alert for now
          // eslint-disable-next-line no-alert
          window.alert(err);
        }}
      />

      <SettingsModal
        open={settingsOpen}
        constraints={constraints}
        onSave={(updated) => {
          setConstraints(updated);
          setSettingsOpen(false);
        }}
        onDismiss={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export const GraphEditorApp = (props) => (
  <ReactFlowProvider>
    <GraphEditorInner {...props} />
  </ReactFlowProvider>
);
