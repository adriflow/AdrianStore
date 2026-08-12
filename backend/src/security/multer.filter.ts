import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';
import { Response } from 'express';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const isSizeError = exception.code === 'LIMIT_FILE_SIZE';
    const statusCode = isSizeError ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
    response.status(statusCode).json({
      statusCode,
      message: isSizeError ? 'La imagen supera el tamaño máximo permitido (5 MB)' : 'Archivo no permitido',
      error: 'Bad Request',
    });
  }
}
