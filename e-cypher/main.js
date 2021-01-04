import * as ecypher from './ecypher.js';

function handleEncypher(e) {
  e.preventDefault();
  const cypher = ecypher.buildCypher("abcdefghijklmnopqrstuvwxyz", "e");
  const message = document.getElementById("encypher-text-area").value;
  document.getElementById('decypher-text-area').value =
    ecypher.encypher(message, cypher);
}

function handleDecypher(e) {
  e.preventDefault();
  const cypher = ecypher.buildCypher("abcdefghijklmnopqrstuvwxyz", "e");
  const message = document.getElementById("decypher-text-area").value;
  document.getElementById('encypher-text-area').value = 
    ecypher.decypher(message, cypher)
}

document.getElementById('encypher-form').onsubmit = handleEncypher; 
document.getElementById('decypher-form').onsubmit = handleDecypher; 
