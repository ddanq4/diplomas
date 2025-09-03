import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const specPath = path.resolve(__dirname, 'openapi.yaml');
export const openapiDocument = YAML.load(specPath);

export function mountSwagger(app) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
        explorer: true,
    }));
    app.get('/api/openapi.yaml', (_req, res) => {
        res.type('text/yaml').sendFile(specPath);
    });
}
