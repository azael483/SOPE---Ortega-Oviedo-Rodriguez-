const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

const swaggerOptions = {
  definition: { openapi: '3.0.0', info: { title: 'Test', version: '1.0.0' } },
  apis: [__filename],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Test endpoint
 *     responses: { 200: { description: OK } }
 */
app.get('/ping', (req, res) => res.send('pong'));

app.listen(3002, () => console.log('http://localhost:3002/api-docs'));