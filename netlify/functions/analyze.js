exports.handler = async (event) => {
    console.log('=== ANALYZE FUNCTION CALLED ===');
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { eventName, contenders } = JSON.parse(event.body);
        console.log('Event:', eventName);
        console.log('Contenders:', contenders);
        
        const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 800,
                messages: [{
                    role: "user",
                    content: `Quick research: Who are the top 2 medal favorites for ${eventName} among: ${contenders}? Give a 2-sentence analysis with one specific reason for each pick.`
                }],
                tools: [{
                    "type": "web_search_20250305",
                    "name": "web_search"
                }]
            })
        });

        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Full response:', JSON.stringify(data, null, 2));
        
        // Check for error in response
        if (data.error) {
            console.error('Claude API error:', data.error);
            throw new Error(data.error.message || 'Claude API error');
        }
        
        // Check if content exists and is an array
        if (!data.content || !Array.isArray(data.content)) {
            console.error('Unexpected response structure:', data);
            throw new Error('Unexpected response from Claude API');
        }
        
        let analysisText = '';
        for (const block of data.content) {
            console.log('Processing block type:', block.type);
            if (block.type === 'text') {
                analysisText += block.text;
            }
        }
        
        console.log('Analysis:', analysisText);
        
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
        console.error('=== ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
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
