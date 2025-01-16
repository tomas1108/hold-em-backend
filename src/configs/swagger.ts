// npm i --save-dev @types/swagger-jsdoc
import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Poker API',
            version: '1.0.0',
            description: 'API documentation using Swagger',
        },
        servers: [
            {
                url: `${process.env.SELF_URL}/api`,
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',  // Header bạn muốn gắn token vào
                },
            },
        },
        security: [
            {
                ApiKeyAuth: [],
            },
        ],
    },
    apis: ['./**/*.ts'], // Chỉ đường dẫn tới các tệp chứa API
};

// Tạo document Swagger
export const swaggerDocs = swaggerJsDoc(swaggerOptions);