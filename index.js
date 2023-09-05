const fs = require('fs');
const path = require('path');

const imageFolderPath = path.resolve(__dirname, '72x72');
const outputFile = path.resolve(__dirname, '..', '..', 'src', 'components', 'emoji', 'emojiNames.json');

fs.readdir(imageFolderPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  const emojiNames = files
    .filter(file => file.endsWith('.png'))
    .map(file => file.replace('.png', ''))
    .map(name => `${name}`)

  const content = JSON.stringify(emojiNames);

  fs.writeFile(outputFile, content, err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log(`File '${outputFile}' created successfully.`);
  });
});
