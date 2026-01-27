import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const obj = exceptionResponse as any;
        message = obj.message || message;
        error = obj.error || error;
        details = obj.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Enhance error messages with user-friendly explanations
    let userMessage = message;
    let suggestion: string | undefined;

    if (status === HttpStatus.BAD_REQUEST) {
      suggestion = 'Please check your input and try again.';
      if (message.includes('validation') || message.includes('required')) {
        userMessage = `Validation Error: ${message}`;
        suggestion = 'Please review the form fields and ensure all required fields are filled correctly.';
      }
    } else if (status === HttpStatus.UNAUTHORIZED) {
      userMessage = 'Authentication required. Please log in again.';
      suggestion = 'Your session may have expired. Please log in and try again.';
    } else if (status === HttpStatus.FORBIDDEN) {
      userMessage = 'You do not have permission to perform this action.';
      suggestion = 'Please contact your administrator if you believe you should have access.';
    } else if (status === HttpStatus.NOT_FOUND) {
      userMessage = `Resource not found: ${message}`;
      suggestion = 'The requested resource may have been deleted or moved.';
    } else if (status === HttpStatus.CONFLICT) {
      userMessage = `Conflict: ${message}`;
      suggestion = 'This resource already exists or conflicts with existing data.';
    } else if (status >= 500) {
      userMessage = 'A server error occurred.';
      suggestion = 'Please try again later. If the problem persists, contact support.';
    }

    const errorResponse = {
      success: false,
      error: {
        code: error,
        message: userMessage,
        originalMessage: message,
        ...(suggestion && { suggestion }),
        ...(details && { details }),
        statusCode: status,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: (request as any).requestId,
    };

    response.status(status).send(errorResponse);
  }
}
