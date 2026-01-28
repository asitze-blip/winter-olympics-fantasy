exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { eventName, contenders } = JSON.parse(event.body);
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1500,
                messages: [{
                    role: "user",
                    content: `Search the web for current form, recent results, and expert predictions for these ${eventName} contenders: ${contenders}. Based on your research, provide a focused analysis (2-3 sentences) identifying which 2-3 athletes are the strongest picks for medals and why, citing specific recent performances or competitive advantages.`
                }],
                tools: [{
                    "type": "web_search_20250305",
                    "name": "web_search"
                }]
            })
        });

        const data = await response.json();
        
        // Handle tool use in response
        let analysisText = '';
        for (const block of data.content) {
            if (block.type === 'text') {
                analysisText += block.text;
            }
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                analysis: analysisText || 'Unable to generate analysis.' 
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Failed to generate analysis',
                details: error.message 
            })
        };
    }
};
