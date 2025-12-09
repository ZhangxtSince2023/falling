const axios = require('axios');

const API_KEY = process.env.API_KEY || 'AIzaSyDXypBmfROHjQN3JzXuuVn1RHu6Grcaqac'; // 优先读取环境变量，否则使用硬编码

async function listModels() {
    console.log('🚀 正在查询可用模型...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await axios.get(url);
        const models = response.data.models;

        if (models && models.length > 0) {
            console.log('✅ 可用模型列表:');
            models.forEach(model => {
                console.log(`- ${model.name}`);
                if (model.supported_generation_methods && model.supported_generation_methods.length > 0) {
                    console.log(`  支持的方法: ${model.supported_generation_methods.join(', ')}`);
                }
            });
        } else {
            console.log('🤷‍♀️ 未找到任何可用模型。请检查您的 API Key 或权限。');
        }

    } catch (error) {
        console.error('❌ 查询模型时出错:');
        if (error.response) {
            console.error(`状态码: ${error.response.status}`);
            console.error(`错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(error.message);
        }
    }
}

listModels();
