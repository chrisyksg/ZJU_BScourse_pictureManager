// backend/services/aiService.js
const OpenAI = require('openai');
const fs = require('fs');

// 虽然用的是 OpenAI 的库，但 baseURL 指向阿里云服务器
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY, 
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", 
});

const analyzeImage = async (imagePath) => {
    try {
        // 1. 读取本地图片转为 Base64 字符串供 AI 识别
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // 2. 发送请求给通义千问视觉大模型
        const response = await openai.chat.completions.create({
            model: "qwen-vl-plus", // 这里根据百炼控制台的模型名填写
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "给这张图3-5个中文分类标签，用逗号隔开，不要有废话。" },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                        },
                    ],
                },
            ],
        });

        // 3. 返回解析后的标签数组
        const content = response.choices[0].message.content;
        return content.split(/[,，]/).map(tag => tag.trim());
    } catch (error) {
        console.error("AI 分析具体报错:", error.message);
        return [];
    }
};

module.exports = { analyzeImage };