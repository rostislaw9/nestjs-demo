import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Demo API Documentation')
    .setDescription('Demo API for NestJS framework')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      operationsSorter: (a: any, b: any) => {
        const methodOrder = ['get', 'post', 'put', 'patch', 'delete'];
        return (
          methodOrder.indexOf(a.get('method')) -
          methodOrder.indexOf(b.get('method'))
        );
      },
      tagsSorter: 'alpha',
    },
  });
}
