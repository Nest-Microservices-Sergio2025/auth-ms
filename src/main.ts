import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { envs } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {

    const logger = new Logger("Auth-Microservice")

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.NATS,
            options: {
                servers: envs.NATS_SERVERS,
            }
        }
    );

    // ✅ APLICAR EL PIPE GLOBALMENTE
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,  // Convierte automáticamente los tipos
            whitelist: true,  // Elimina propiedades no definidas en los DTO
            forbidNonWhitelisted: true, // Lanza error si hay propiedades desconocidas
            transformOptions: {
                enableImplicitConversion: true,  // Convierte sin necesidad de `@Type`
            },
        }),
    );
    console.log("Subiendo cambios para hacer CI/CD");

    logger.log(`products microservices running on http://localhost:${envs.PORT}`);


    await app.listen();
}
bootstrap();
