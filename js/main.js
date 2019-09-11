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
        'background-color': 'mapData(level,0,'+maxLevel+',gray,red)'
    }).update()
    
    
;
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
