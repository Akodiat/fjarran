document.addEventListener('DOMContentLoaded', function(){
    fromSequence();
    selected = [];
});

var m = new Map([
  ['A', ['A']],
  ['C', ['C']],
  ['G', ['G']],
  ['T', ['T']],

  ['W', ['A', 'T']],
  ['S', ['C', 'G']],
  ['M', ['A', 'C']],
  ['K', ['G', 'T']],
  ['R', ['A', 'G']],
  ['Y', ['C', 'T']],

  ['B', ['C', 'G', 'T']],
  ['D', ['A', 'G', 'T']],
  ['H', ['A', 'C', 'T']],
  ['V', ['A', 'C', 'G']],

  ['N', ['A', 'C', 'G', 'T']]
]);

var maxLevel = 0

// Recursively add nodes from a sequence
function addFromSeq(seq, level){
    // Keep track of the number of recursive calls
    if(level > maxLevel) {
        maxLevel = level;
    }
    // Try to add the sequence as a node
    try {
        console.log(seq);
        addNode(seq, level);
    }
    catch(e) {
        // Return if there is already a node for this sequence
        return;
    }

    // Loop through each nucleotide in the sequence
    var strandLength = seq.length;
    for(var i=0; i<strandLength; i++) {
        var choices = m.get(seq[i]);
        // If the nucleotide is not valid
        if(!choices) {
            var e = `"${seq[i]}" is not a valid nucleotide`;
            console.warn(e);
            document.getElementById('status').innerHTML = e;
            continue;
        }
        // If the nucleotide is not specific
        if (choices.length > 1) {
            // For each possible specific nucleotide at the location
            choices.forEach(function(c) {
                var newSeq = setCharAt(seq,i,c);
                // Make a recursive call for the new sequence
                addFromSeq(newSeq, level+1);
                // Add a connection in the graph
                addEdge(seq, newSeq);
            });
        }
    }
}

// from https://stackoverflow.com/a/1431110
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

function addNode(seq, level) {
    cy.add({
        group: 'nodes', data: {id: seq, level: level}, classes: 'top-center'
    });
}

function addEdge(from, to) {
    cy.add({group: 'edges', data: {source: from, target: to}});
}

function fromSequence(){
    window.cy = cytoscape({
        container: document.getElementById('cy'),
        autounselectify: true,
        boxSelectionEnabled: false,

        style: [
            {selector: 'node', css: {'label': 'data(id)'}},
            {selector: 'edge', css: {
                'line-color': '#babdb6',
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle'}},
            {selector: 'node.highlight', style: {
                'background-color': '#e9b96e',
                'border-color': '#f57900',
                'border-width': '5px'
            }
        },
        ]
    });

    var s = document.getElementById("strandText").value.toUpperCase();
    console.log("Input strand: "+s);
    document.getElementById('status').innerHTML = '';
    addFromSeq(s, 0)
    
    var layout = cy.layout({
      name: 'cola',
      maxSimulationTime: 10000
    });

    layout.run();
    
    console.log("Max level: "+maxLevel);
    
    cy.style().selector('node').style({
        'background-color': `mapData(level,0,${maxLevel},gray,#729fcf)`
    }).update()
}

function selectNodes() {
    var nodes = findNMostDistant(document.getElementById('nNodes').value);
    document.getElementById("nodesList").innerHTML = nodes.join(', ');
}

function findNMostDistant(nNodes) {
    // Get nodes with a defined sequence:
    var bn = getBoundaryNodes();
    bn.removeClass('highlight')
    // If you want more nodes that there are, you get all
    if (nNodes >= bn.length) {
        var nodes = bn;
    } else {
        // Create empty collection of nodes
        var nodes = cy.collection();
        // Select a random node
        var nodeA = getRandElem(bn);
        console.log(`Selected ${nodeA.id()} from boundary nodes`);
        while(true) {
            nodes = nodes.add(nodeA);
            if(nodes.length >= nNodes) {
                break;
            }
            // Find shortest path from node a to all nodes
            var dijkstraA = cy.elements().dijkstra(nodeA);
            
            // calculate which (not yet selected) node b is furthest from a
            var nodeB = bn.subtract(nodes).max(function(e){
                return dijkstraA.distanceTo(e);
            }).ele;

            console.log(`${nodeB.id()} is furthest from ${nodeA.id()}`);
            nodes = nodes.add(nodeB);
            if(nodes.length >= nNodes) {
                break;
            }
            
            // Find node furthest from both a and b
            var dijkstraB = cy.elements().dijkstra(nodeB);
            nodeA = bn.subtract(nodes).max(function(e){
                return dijkstraA.distanceTo(e) * dijkstraB.distanceTo(e);
            }).ele;
            
            console.log(`${nodeA.id()} is furthest from last pair`);
        }
    }
    // Highlight selected nodes
    nodes.addClass('highlight')

    // Return list of node IDs
    selected = [];
    nodes.forEach(function(node){
        selected.push(node.id())
    })
    return selected;
}

function getRandElem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function getBoundaryNodes() {
    return cy.nodes().filter(`[level = ${maxLevel}]`);
}
