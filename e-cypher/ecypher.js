export function buildCypher(alphabet, letter) {
  const array = alphabet.split("");
  let cypher = {};
  for(let i = 0; i < array.length; i++) {
    cypher[array[i]] = letter.repeat(i + 1);
  }
  cypher["CHOSEN_LETTER"] = letter;
  return cypher;
} 

export function encypher(message, cypher) {
  let translation = "";
  message = message.toLowerCase().split("");
  message.forEach(letter => {
    translation += cypher[letter] ? 
      cypher[letter] + cypher["CHOSEN_LETTER"].toUpperCase() : 
      letter;
  })
  return translation;
} 

export function decypher(message, cypher) {
  const keys = Object.keys(cypher);
  let translation = ""; 

  for (let i = 0; i < message.length; i++) {

    const letter = message[i];
    if(letter === cypher["CHOSEN_LETTER"]) {
      const nextLetterIndex = message.indexOf(cypher["CHOSEN_LETTER"].toUpperCase(), i); 
      const repeats = nextLetterIndex - i; 
      
      // String keys are in insertion order since ES2015
      translation += keys[repeats - 1];
      i = i + repeats; 
    }
    else {
      translation += letter;
    }

  }
  return translation;
}

function test() {
  console.log(`buildCypher should build a correct cypher given an English 
  alphabet string\n\n`)

  const cypher = buildCypher("abcdefghijklmnopqrstuvwxyz", "e");

  console.log(cypher);

  console.log(`\nencypher should correctly translate English to 
  cypher text\n`)

  const message = "abc!? abcd.\ "
  const result = encypher(message, cypher);
  const expected = "eEeeEeeeE!? eEeeEeeeEeeeeE.\ "

  console.log(`result: ${result}`)
  console.log(`expected: ${expected}`)
  console.log(`Result equals expected? ${result === expected}`)

  console.log(`\ndecypher should correctly translate cypher to English\n`)

  const translation = decypher(result, cypher)

  console.log(`result: ${translation}`)
  console.log(`expected: ${message}`)
  console.log(`Result equals expected? ${translation === message}`)
}
