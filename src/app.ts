import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import { stripeWebhookController } from './app/webhooks/stripe/stripe.controller';
import { generateOpenApiDocument } from './docs/openapi';
import { Morgan } from './shared/morgen';
import config from './config';
import router from './routes';

const app = express();

// trust proxy to get client real ip
app.set('trust proxy', true);

//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//stripe webhook
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookController,
);

//body parser
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

//file retrieve
app.use(express.static('uploads'));

//router
app.use('/api/v1', router);

//live response
app.get('/', (req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The ${config.server_name} server is alive and flying 🚀</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    `,
  );
});

// Generate doc once at server startup
const openApiDoc = generateOpenApiDocument();

// Serve the interactive Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

// Route to raw JSON for Postman import
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiDoc);
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
