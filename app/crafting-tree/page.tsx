'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import cytoscape from 'cytoscape';

interface NodeInfo {
  id: string;
  label: string;
  type: string;
  rarity?: string;
}

export default function CraftingTree() {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Ensure DOM is ready
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) {
      return;
    }

      // Initialize Cytoscape with fake data
      // Central node: Medkit
      // Left side: Sources (what creates Medkit)
      // Right side: Outputs (what Medkit creates)
      const CURVATURE = 140;
      const cy = cytoscape({
      container: containerRef.current,
      
      elements: [
        // CENTER NODE - Item of Interest
        { data: { id: 'medkit', label: 'Medkit\n(Selected)', type: 'center', rarity: 'Rare' } },
        
        // LEFT SIDE - Sources/Inputs
        { data: { id: 'chemicals', label: 'Chemicals', type: 'material', rarity: 'Uncommon' } },
        { data: { id: 'chemicals2', label: 'Chemicals', type: 'material', rarity: 'Uncommon' } },
        { data: { id: 'fabric', label: 'Fabric', type: 'material', rarity: 'Common' } },
        { data: { id: 'bandage', label: 'Bandage', type: 'item', rarity: 'Common' } },
        { data: { id: 'lance', label: 'Lance\n(Vendor)', type: 'vendor', rarity: null } },
        { data: { id: 'plastic', label: 'Plastic Parts', type: 'material', rarity: 'Common' } },
        
        // RIGHT SIDE - Outputs
        { data: { id: 'first-aid', label: 'First Aid Kit', type: 'item', rarity: 'Epic' } },
        { data: { id: 'health-pack', label: 'Health Pack', type: 'item', rarity: 'Rare' } },
        { data: { id: 'salvaged-parts', label: 'Salvaged Parts', type: 'material', rarity: 'Common' } },
        
        // EDGES - Left to Center (Sources)
        { data: { source: 'chemicals', target: 'medkit', label: 'craft_material', curvature: -CURVATURE } },
        { data: { source: 'chemicals2', target: 'medkit', label: 'craft_material', curvature: -CURVATURE } },
        { data: { source: 'fabric', target: 'medkit', label: 'craft_material', curvature: -CURVATURE } },
        { data: { source: 'bandage', target: 'medkit', label: 'craft_component', curvature: CURVATURE } },
        { data: { source: 'lance', target: 'medkit', label: 'sold_by', curvature: 0 } },
        { data: { source: 'plastic', target: 'medkit', label: 'craft_material', curvature: CURVATURE } },
        
        // EDGES - Center to Right (Outputs)
        { data: { source: 'medkit', target: 'first-aid', label: 'used_in_craft', curvature: CURVATURE } },
        { data: { source: 'medkit', target: 'health-pack', label: 'used_in_craft', curvature: 0 } },
        { data: { source: 'medkit', target: 'salvaged-parts', label: 'salvage_to', curvature: -CURVATURE } },
      ],

      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#8b5cf6',
            'label': 'data(label)',
            'color': '#e9d5ff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 5,
            'font-size': '14px',
            'font-weight': 'bold',
            'width': 80,
            'height': 80,
            'border-width': 4,
            'border-color': '#6d28d9',
            'text-wrap': 'wrap',
            'text-max-width': 100,
          }
        },
        {
          selector: 'node[type="center"]',
          style: {
            'background-color': '#c084fc',
            'border-color': '#e879f9',
            'border-width': 6,
            'width': 120,
            'height': 120,
            'font-size': '16px',
            'font-weight': 'bold',
            'color': '#fae8ff',
          }
        },
        {
          selector: 'node[type="item"]',
          style: {
            'background-color': '#a78bfa',
            'border-color': '#8b5cf6',
          }
        },
        {
          selector: 'node[type="material"]',
          style: {
            'background-color': '#60a5fa',
            'border-color': '#3b82f6',
          }
        },
        {
          selector: 'node[type="vendor"]',
          style: {
            'background-color': '#fbbf24',
            'border-color': '#f59e0b',
            'shape': 'diamond',
            'width': 90,
            'height': 90,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#6366f1',
            'target-arrow-shape': 'none',
            'source-arrow-shape': 'none',
            'curve-style': 'unbundled-bezier',
            'source-endpoint': '90deg',  // Right side of source node
            'target-endpoint': '270deg', // Left side of target node
            'control-point-distances': (ele: any) => {
              const curvature = ele.data('curvature') || 0;
              // Scale curvature - positive for S-curve, negative for mirrored S
              const dist = Math.abs(curvature) * 0.35;
              return curvature >= 0 ? `${dist} -${dist}` : `-${dist} ${dist}`;
            },
            'control-point-weights': '0.33 0.67',
            'edge-distances': 'node-position',
            'label': 'data(label)',
            'font-size': '11px',
            'color': '#c4b5fd',
            'text-background-color': '#07020b',
            'text-background-opacity': 0.9,
            'text-background-padding': 4,
            'text-margin-y': -15,
          }
        },
        {
          selector: 'edge[label="craft_material"]',
          style: {
            'line-color': '#60a5fa',
          }
        },
        {
          selector: 'edge[label="craft_component"]',
          style: {
            'line-color': '#a78bfa',
          }
        },
        {
          selector: 'edge[label="sold_by"]',
          style: {
            'line-color': '#fbbf24',
          }
        },
        {
          selector: 'edge[label="used_in_craft"]',
          style: {
            'line-color': '#c084fc',
          }
        },
        {
          selector: 'edge[label="salvage_to"]',
          style: {
            'line-color': '#34d399',
          }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 6,
            'border-color': '#e879f9',
            'overlay-opacity': 0.3,
            'overlay-color': '#c084fc',
          }
        }
      ],

      layout: {
        name: 'preset',
        positions: (node: any) => {
          const nodeId = node.id();
          const leftX = 200;
          const centerX = 600;
          const rightX = 1000;
          const centerY = 400;
          const spacing = 140; // vertical spacing between nodes
          
          // Center column - Single node
          if (nodeId === 'medkit') {
            return { x: centerX, y: centerY };
          }
          
          // Left column - Sources (5 nodes, centered around middle)
          if (nodeId === 'chemicals') return { x: leftX, y: centerY - spacing * 2 };
          if (nodeId === 'chemicals2') return { x: leftX, y: centerY - spacing * 3 };
          if (nodeId === 'fabric') return { x: leftX, y: centerY - spacing };
          if (nodeId === 'lance') return { x: leftX, y: centerY };
          if (nodeId === 'bandage') return { x: leftX, y: centerY + spacing };
          if (nodeId === 'plastic') return { x: leftX, y: centerY + spacing * 2 };
          
          // Right column - Outputs (3 nodes, centered around middle)
          if (nodeId === 'first-aid') return { x: rightX, y: centerY - spacing };
          if (nodeId === 'health-pack') return { x: rightX, y: centerY };
          if (nodeId === 'salvaged-parts') return { x: rightX, y: centerY + spacing };
          
          return { x: 0, y: 0 };
        },
        fit: true,
        padding: 100,
      },

      // Enable interactivity
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    // Handle node clicks
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data();
      setSelectedNode({
        id: nodeData.id,
        label: nodeData.label,
        type: nodeData.type,
        rarity: nodeData.rarity,
      });
    });

    // Handle background clicks
    cy.on('tap', (event) => {
      if (event.target === cy) {
        setSelectedNode(null);
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [isReady]);

  return (
    <div className="min-h-screen bg-[#07020b] text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#07020b] border-b border-purple-500/20 sticky top-0 z-40">
        <div className="flex items-center justify-between pr-8">
          <div className="flex-shrink-0 h-24 flex items-center">
            <Image
              src="/logo.webp"
              alt="ARC Forge"
              width={320}
              height={96}
              className="h-full w-auto"
              priority
            />
          </div>
          
          <nav className="flex gap-2">
            <a
              href="/"
              className="px-6 py-3 bg-black/20 border border-purple-500/20 rounded-lg text-gray-400 font-medium hover:bg-purple-500/10 hover:text-gray-300 transition-all"
            >
              Item Database
            </a>
            <a
              href="/crafting-tree"
              className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-300 font-medium hover:bg-purple-500/30 transition-all"
            >
              Crafting Tree
            </a>
            <a
              href="#"
              className="px-6 py-3 bg-black/20 border border-purple-500/20 rounded-lg text-gray-400 font-medium hover:bg-purple-500/10 hover:text-gray-300 transition-all"
            >
              Recycling Tree
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph Canvas */}
        <main className="flex-1 relative bg-[#07020b]">
          <div 
            ref={containerRef}
            className="absolute inset-0"
            style={{ 
              width: '100%', 
              height: '100%',
              background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, rgba(7, 2, 11, 1) 100%)'
            }}
          />
        </main>
      </div>
    </div>
  );
}

