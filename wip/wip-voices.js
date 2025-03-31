/* const fixUnclosedHTML = (htmlString) => {
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    const voidElements = new Set(selfClosingTags);
    const tagStack = [];

    // Regex to match opening tags, closing tags, and self-closing tags
    const tagPattern = /<\/?([a-zA-Z0-9-]+)(\s[^>]*?)?\/?>/g;

    // Initialize an array to build the fixed HTML
    const fixedHtml = [];
    let lastIndex = 0;

    // Function to process each tag match
    function processMatch(match, tagName, attributes, offset) {
        tagName = tagName.toLowerCase();

        // Append text content before this tag
        fixedHtml.push(htmlString.slice(lastIndex, offset));
        lastIndex = offset + match.length;

        if (match.startsWith('</')) {
            // Closing tag
            while (tagStack.length > 0) {
                const lastTag = tagStack.pop();
                fixedHtml.push(`</${lastTag.tag}>`);
                if (lastTag.tag === tagName) {
                    break;
                }
            }
        } else if (voidElements.has(tagName) || match.endsWith('/>')) {
            // Self-closing tag or void element
            fixedHtml.push(match);
        } else {
            // Opening tag
            fixedHtml.push(`<${tagName}${attributes || ''}>`);
            tagStack.push({ tag: tagName });
        }
    }

    // Process all tags in the HTML string
    htmlString.replace(tagPattern, processMatch);

    // Append remaining text content
    fixedHtml.push(htmlString.slice(lastIndex));

    // Close any remaining open tags
    while (tagStack.length > 0) {
        const lastTag = tagStack.pop();
        fixedHtml.push(`</${lastTag.tag}>`);
    }

    return fixedHtml.join('');
} */

/* Voices (beta) 
const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                max_tokens: 4096,
                messages: [
                    { role: 'system', content: `Story length is between 100 and 1300 characters. 
                        Use SSML encoding for voice characters, example: 
                        <voice name='Amy'>Hello Matthew!</voice> 
                        Choose a narrator (Amy or Matthew) re-used after each character speaks. Make the voices consistent each time.
                        Options are only: Amy, Joanna, Matthew, Joey`
                    },
                    { role: 'user', content: `Tell ${storySubject}` }
                ],
            });
            
            console.log("------------------- AI FULL RESPONSE -------------------", JSON.stringify(completion));
            
            const aiResponse = fixUnclosedHTML(completion.choices[0].message.content);
*/
