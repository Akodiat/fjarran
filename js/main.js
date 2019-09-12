document.addEventListener('DOMContentLoaded', function(){
    fromSequence()
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


// from https://stackoverflow.com/a/1431110
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

function addNode(seq, level) {
    cy.add({
        group: 'nodes',
        data: {
            id: seq,
            level: level
        },
        classes: 'top-center'}
    );
}

function addEdge(from, to) {
    cy.add({group: 'edges',
        data: {source: from, target: to}
    });
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
                'target-arrow-shape': 'triangle'}}
        ]
    });

    var s = document.getElementById("strandText").value.toUpperCase();
    console.log("Input strand: "+s);
    addFromSeq(s, 0)
    
    var layout = cy.layout({
      name: 'cola'
    });

    layout.run();
    
    console.log("Max level: "+maxLevel);
    
    cy.style().selector('node').style({
        'background-color': `mapData(level,0,${maxLevel},gray,red)`
    }).update()
}

var maxLevel = 0

function addFromSeq(seq, level){
    if(level > maxLevel) {
        maxLevel = level;
    }
    try {
        console.log(seq);
        addNode(seq, level);
    }
    catch(e) {
        // Node already added
        return;
    }
    var strandLength = seq.length;
    for(var i=0; i<strandLength; i++) {
        var choices = m.get(seq[i]);
        if (choices.length > 1) {
            choices.forEach(function(c) {
                var newSeq = setCharAt(seq,i,c);
                addFromSeq(newSeq, level+1);
                addEdge(seq, newSeq);
            });
        }
    }
}

function selectNodes() {
    var nodes = findNMostDistant(document.getElementById('nNodes').value);
    var listDOM = document.getElementById("nodesList");
    //listDOM.style.display = "inline";
    document.getElementById("nodesList").innerHTML = nodes.join(', ');
}

function findNMostDistant(nNodes) {
    var bn = getBoundaryNodes();
    if (nNodes >= bn.length) {
        var nodes = bn;
    } else {
        var nodes = bn.subtract(bn);
        var rn = getRandElem(bn.subtract(nodes));
        console.log(`Selected ${rn.id()} from boundary nodes`);
        while(true) {
            nodes = nodes.add(rn);
            if(nodes.length >= nNodes) {
                break;
            }
            var dijkstra = cy.elements().dijkstra(rn);
            
            var furthestNode = bn.subtract(nodes).max(function(e){
                return dijkstra.distanceTo(e);
            }).ele;

            console.log(`${furthestNode.id()} is furthest from ${rn.id()}`);
            nodes = nodes.add(furthestNode);
            if(nodes.length >= nNodes) {
                break;
            }
            
            // Find node furthest from pair
            var dijkstra2 = cy.elements().dijkstra(furthestNode);
            rn = bn.subtract(nodes).max(function(e){
                return dijkstra.distanceTo(e) + 
                      dijkstra2.distanceTo(e);
            }).ele;
            
            console.log(`${rn.id()} is furthest from last pair`);
        }
    }
    var nodeIds = []
    nodes.forEach(function(node){
        nodeIds.push(node.id())
    })
    return nodeIds;
}

function getRandElem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function getBoundaryNodes() {
    return cy.nodes().filter(`[level = ${maxLevel}]`);
}
