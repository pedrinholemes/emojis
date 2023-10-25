const fs = require('fs');
const path = require('path');

const {emojis} = require('./emojis.json')

const imageFolderPath = path.resolve(__dirname, '72x72');
const outputFile = path.resolve(__dirname, 'emoji.json');
const newOutputDir = path.resolve(__dirname, 'emoji')
/**
 * Encontra um elemento em um array e retorna o valor encontrado.
 *
 * @template T
 * @param {T[]} arr - O array para ser pesquisado.
 * @param {(target: T) => boolean} target - O valor-alvo a ser encontrado no array.
 * @returns {T | undefined} - O valor encontrado ou `undefined` se não for encontrado.
 */
function findAlternative(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (target(arr[i])) {
      return arr[i];
    }
  }
  return undefined; // ou qualquer valor padrão, se não encontrar
}

/**
 * Executa uma função assíncrona em paralelo para uma matriz de itens com um limite de concorrência.
 *
 * @template T
 * @template R
 * @param {T[]} items - A matriz de itens a serem processados.
 * @param {number} concurrencyLimit - O número máximo de execuções simultâneas.
 * @param {(item: T) => Promise<R>} asyncFn - A função assíncrona a ser executada para cada item.
 * @returns {Promise<R[]>} Uma promessa que resolve em uma matriz de resultados na mesma ordem dos itens.
 */
async function runWithConcurrencyLimit(items, concurrencyLimit, asyncFn) {
  const results = [];
  const queue = [...items];

  async function processQueue() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        const result = await asyncFn(item);
        results.push(result);
      }
    }
  }

  const concurrencyPromises = [];

  for (let i = 0; i < concurrencyLimit; i++) {
    concurrencyPromises.push(processQueue());
  }

  await Promise.all(concurrencyPromises);

  return results;
}


function parseModifierEmojiName(inputString) {
  const emojiNameParsed = {
    name: "",
    modifier: [],
  };

  // Divide a string em partes usando ":" como separador
  const parts = inputString.split(":").map((part) => part.trim());

  if (parts.length > 0) {
    emojiNameParsed.name = parts[0];

    if (parts.length > 1) {
      // Divide a parte de modificadores em partes usando ","
      const modifiers = parts[1].split(",").map((modifier) => modifier.trim());

      for (const modifier of modifiers) {
        // Divide cada modificadores em partes usando ","
        const modifierParts = modifier.split(",").map((part) => part.trim());

        if (modifierParts.length > 0) {
          emojiNameParsed.modifier.push(modifierParts);
        }
      }
    }
  }

  // Se não houver modificadores, retorne null
  if (emojiNameParsed.modifier.length === 0) {
    return null;
  }

  return emojiNameParsed;
}


/**
 * 
 * @param {string} inputString 
 * @returns {string}
 */
function normalizeString(inputString) {
  // Remove caracteres especiais e substitui letras acentuadas por suas versões sem acento
  const normalizedString = inputString
    .normalize("NFD")
    .replace(/-+/g, ' ')
    .replace(/,+/g, '')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .toLowerCase();

  // Substitui espaços por -
  const finalString = normalizedString.replace(/\s+/g, "-");

  return finalString.toLowerCase().trim();
}

fs.readdir(imageFolderPath, async (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }
  const emojisWithNormalName = emojis.map(a => normalizeString(a.name))

  const emojiNames = files
    .filter(file => file.endsWith('.png'))
    .map(file => file.replace('.png', ''))
    .map(name => `${name}`)

  const finalEmojisRaw = [
    ...emojiNames.map(emoji => {
      const newFilename = normalizeString(emoji)
  
      const emojiData = findAlternative(emojisWithNormalName, a => a === newFilename)
      if(!emojiData || typeof emojiData !== 'object') return null
  
      return ({
        name: emoji,
        filename: newFilename,
        alt: emojiData.emoji,
        category: emojiData.category,
        emojiData
      })
    }),
    ...emojiNames.map(emoji => {
      const newFilename = normalizeString(emoji)
      const emojiData = findAlternative(emojis, b => {
        const emojiModifier = parseModifierEmojiName(b.name)
    
        if(emojiModifier === null || !emojiModifier) return false
    
        const newEmojiName = emojiModifier.name + ' ' + emojiModifier.modifier.join(' ')
    
        return newFilename === normalizeString(newEmojiName)
      })

      if(!emojiData || typeof emojiData !== 'object') return null
  
      return ({
        name: emoji,
        filename: newFilename,
        alt: emojiData.emoji,
        category: emojiData.category,
        emojiData
      })
    })
  ]

  const finalEmojis = finalEmojisRaw.filter(Boolean)

  const notEmojis = emojiNames.filter(a => finalEmojis.every(b => b.name !== a))


  fs.writeFile(outputFile, JSON.stringify(finalEmojis, null, 2), err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    // console.log(`File '${outputFile}' created successfully.`);
  });
  fs.writeFile(outputFile.replace('.json', '.txt'), finalEmojis.map(a => `${a.name};${a.filename};${a.alt}`).join('\n'), err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    // console.log(`File '${outputFile.replace('.json', '.txt')}' created successfully.`);
  });
  fs.writeFile(outputFile.replace('.json', '.not.txt'), notEmojis.join('\n'), err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    // console.log(`File '${outputFile.replace('.json', '.not.txt')}' created successfully.`);
  });
  // fs.writeFile(outputFile.replace('.json', '.modifies.txt'), JSON.stringify(modifiersEmojis, null, 2), err => {
  //   if (err) {
  //     console.error('Error writing file:', err);
  //     return;
  //   }
  //   // console.log(`File '${outputFile.replace('.json', '.not.txt')}' created successfully.`);
  // });
  finalEmojis.map(({name, filename}) => 
    fs.writeFile(path.resolve(newOutputDir, filename + '.png'), fs.readFileSync(path.resolve(imageFolderPath, name + '.png')), err => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      // console.log(`File '${path.resolve(newOutputDir, filename + '.png')}' created successfully.`);
    })
  )
})
