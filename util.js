const getRandomString = (stringArray) => {
    const randomIndex = Math.floor(Math.random() * stringArray.length);
    return stringArray[randomIndex];
}

const getAorAn = (word) => ['a', 'e', 'i', 'o', 'u'].includes(word.toLowerCase().charAt(0)) ? 'an' : 'a';

function removeNarrators(text) {
    // Define the prefixes to remove
    const narrators = ['Amy: ', 'Matthew: '];
    
    // Use a regular expression to replace any of the prefixes with an empty string
    const regex = new RegExp('^(' + narrators.join('|') + ')', 'i');
    
    return text.replace(regex, '');
}

module.exports = { getRandomString, getAorAn, removeNarrators }
